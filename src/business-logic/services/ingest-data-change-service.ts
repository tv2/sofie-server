import { DataChangeService } from './interfaces/data-change-service'
import { IngestRundownSynchronizer, RundownSynchronizeResult } from './ingest-rundown-synchronizer'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Rundown } from '../../model/entities/rundown'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { Logger } from '../../logger/logger'
import { IngestedRundownRepository } from '../../data-access/repositories/interfaces/ingested-rundown-repository'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { PartRepository } from '../../data-access/repositories/interfaces/part-repository'
import { BasicRundown } from '../../model/entities/basic-rundown'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { Segment } from '../../model/entities/segment'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { ActionGenerationService } from './action-generation-service'
import { Part } from '../../model/entities/part'
import { Timeline } from '../../model/entities/timeline'
import { AsyncLock } from '../async-lock'
import { PieceRepository } from '../../data-access/repositories/interfaces/piece-repository'
import { IngestedPiece } from '../../model/entities/ingested-piece'

interface DeletedInfo {
  readonly deletedPartsInfo: readonly DeletedPartInfo[]
  readonly deletedSegmentsInfo: readonly DeletedSegmentInfo[]
}

interface DeletedPartInfo {
  part?: Part
  originalPartId: string
  originalSegmentId: string
}

interface DeletedSegmentInfo {
  segment?: Segment
  originalSegmentId: string
}

const SYNCHRONIZE_DEBOUNCE_DELAY_IN_MS: number = 600

export class IngestDataChangeService implements DataChangeService {

  private isSynchronizing: boolean = false
  private dataChangeEventDebounceTimerId?: NodeJS.Timeout
  private readonly affectedRundownIds: Set<string> = new Set()
  private readonly logger: Logger

  constructor(
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly rundownLock: AsyncLock,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly pieceRepository: PieceRepository,
    private readonly rundownChangedListener: DataChangedListener<IngestedRundown>,
    private readonly segmentChangedListener: DataChangedListener<IngestedSegment>,
    private readonly partChangedListener: DataChangedListener<IngestedPart>,
    private readonly pieceChangedListener: DataChangedListener<IngestedPiece>,
    private readonly ingestRundownSynchronizer: IngestRundownSynchronizer,
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly timelineRepository: TimelineRepository,
    private readonly actionGenerationService: ActionGenerationService,
    logger: Logger,
  ) {
    this.logger = logger.tag(this.constructor.name)

    this.rundownChangedListener.onCreated(rundown => this.registerChangeForRundown(rundown.id))
    this.rundownChangedListener.onUpdated(rundown => this.registerChangeForRundown(rundown.id))
    this.rundownChangedListener.onDeleted(rundownId => this.registerChangeForRundown(rundownId))

    this.segmentChangedListener.onCreated(segment => this.registerChangeForRundown(segment.rundownId))
    this.segmentChangedListener.onUpdated(segment => this.registerChangeForRundown(segment.rundownId))
    this.segmentChangedListener.onDeleted(segmentId => {
      this.segmentRepository.getSegment(segmentId)
        .then(segment => this.registerChangeForRundown(segment.rundownId))
        .catch(error => {
          this.logger.data(error).error(`Failed getting segment with id '${segmentId}' for delete segment event.`)
          this.markAllRundownsAsAffected().catch(error => this.logger.data(error).error(`Failed marking all rundowns as affected when deletion of the segment with id '${segmentId}' failed.`))
        })
    })

    this.partChangedListener.onCreated(part => this.registerChangeForRundown(part.rundownId))
    this.partChangedListener.onUpdated(part => this.registerChangeForRundown(part.rundownId))
    this.partChangedListener.onDeleted(partId => {
      this.partRepository.getPart(partId)
        .then(part => this.registerChangeForRundown(part.rundownId))
        .catch(error => {
          this.logger.data(error).warn(`Failed getting part with id '${partId}' for deleted part event. Marking all rundowns as affected.`)
          this.markAllRundownsAsAffected().catch(error => this.logger.data(error).error(`Failed marking all rundowns as affected when deletion of the part with id '${partId}' failed.`))
        })
    })

    this.pieceChangedListener.onCreated(piece => this.registerChangeForRundown(piece.rundownId))
    this.pieceChangedListener.onUpdated(piece => this.registerChangeForRundown(piece.rundownId))
    this.pieceChangedListener.onDeleted(pieceId => {
      this.pieceRepository.getPiece(pieceId)
        .then(piece => this.registerChangeForRundown(piece.rundownId))
        .catch(error => {
          this.logger.data(error).error(`Failed getting piece with id '${pieceId}' for deleted piece event.`)
          this.markAllRundownsAsAffected().catch(error => this.logger.data(error).error(`Failed marking all rundowns as affected when deletion of the piece with id '${pieceId}' failed.`))
        })
    })
  }

  private registerChangeForRundown(rundownId: string): void {
    this.affectedRundownIds.add(rundownId)
    this.clearAndStartSynchronizeTimer()
  }

  private clearAndStartSynchronizeTimer(): void {
    clearTimeout(this.dataChangeEventDebounceTimerId)
    this.dataChangeEventDebounceTimerId = setTimeout(() => {
      this.dataChangeEventDebounceTimerId = undefined
      this.synchronizeAffectedRundowns().catch(error => this.logger.data(error).error('Failed synchronizing one or more affected rundowns.'))
    }, SYNCHRONIZE_DEBOUNCE_DELAY_IN_MS)

  }

  private async synchronizeAffectedRundowns(): Promise<void> {
    if (this.isSynchronizing) {
      this.logger.trace('Trying to synchronize while synchronizing.')
      return
    }
    this.isSynchronizing = true

    const rundownId: string | undefined = [...this.affectedRundownIds][0]
    if (!rundownId) {
      this.isSynchronizing = false
      return
    }

    this.affectedRundownIds.delete(rundownId)

    try {
      const startTime: bigint = process.hrtime.bigint()
      this.logger.debug(`Starting to synchronize rundown with id '${rundownId}'.`)
      await this.synchronizeRundown(rundownId)
      const timeSpentInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
      this.logger.trace(`Synchronizing changes for rundown with id '${ rundownId }' took ${ timeSpentInMs }ms.`)
    } catch (error) {
      this.logger.data(error).error(`Failed synchronizing changes for rundown with id '${rundownId}'.`)
    }

    this.isSynchronizing = false
    setImmediate(() => {
      this.synchronizeAffectedRundowns().catch(error => this.logger.data(error).error('Failed synchronizing one or more rundowns.'))
    })
  }

  private async markAllRundownsAsAffected(): Promise<void> {
    const rundownIds: ReadonlySet<string> = await this.getAllRundownIds()
    rundownIds.forEach(rundownId => this.registerChangeForRundown(rundownId))
  }

  public async initialize(): Promise<void> {
    await this.synchronizeAllRundowns().catch(error => this.logger.data(error).error('Failed synchronizing all rundowns on initialization.'))
  }

  private async synchronizeAllRundowns(): Promise<void> {
    const allRundownIds: ReadonlySet<string> = await this.getAllRundownIds()
    this.logger.trace(`Synchronizing state for ${allRundownIds.size} rundowns.`)
    for (const rundownId of allRundownIds) {
      try {
        const startTime: bigint = process.hrtime.bigint()
        await this.synchronizeRundown(rundownId)
        const timeSpentInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
        this.logger.trace(`Synchronizing changes for rundown with id '${rundownId}' took ${timeSpentInMs}ms.`)
      } catch (error) {
        this.logger.data(error).error(`Failed synchronizing changes for rundown with id '${rundownId}'.`)
      }
    }
    await this.actionGenerationService.generateActionsForSystem().catch(error => this.logger.data(error).error('Failed generating system actions.'))
  }

  private async getAllRundownIds(): Promise<ReadonlySet<string>> {
    const ingestedRundownIds: readonly string[] = await this.ingestedRundownRepository.getIngestedRundownIds()
    const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()
    return new Set([
      ...ingestedRundownIds,
      ...basicRundowns.map(basicRundown => basicRundown.id),
    ])
  }

  private async synchronizeRundown(rundownId: string): Promise<void> {
    await this.rundownLock.withLock(this.synchronizeRundown.name, async () => {
      const rundown: Rundown | undefined = await this.rundownRepository.getRundown(rundownId).catch(error => {
        if (error instanceof NotFoundException) {
          return undefined
        }
        throw error
      })
      const ingestedRundown: IngestedRundown | undefined = await this.ingestedRundownRepository.getIngestedRundown(rundownId).catch(error => {
        if (error instanceof NotFoundException) {
          return undefined
        }
        throw error
      })

      if (!ingestedRundown) {
        if (rundown) {
          this.rundownEventEmitter.emitRundownDeleted(rundownId)
          await this.rundownRepository.deleteRundown(rundownId)
          await this.actionGenerationService.removeActionsForRundown(rundownId)
        }
        return
      }

      if (!rundown) {
        await this.createEmitAndPersistRundown(ingestedRundown)
        return
      }

      await this.updateEmitAndPersistRundown(rundown, ingestedRundown)
    })
  }

  private async createEmitAndPersistRundown(ingestedRundown: IngestedRundown): Promise<void> {
    const startTime: bigint = process.hrtime.bigint()
    const emptyRundown: Rundown = this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(ingestedRundown)

    const rundownSynchronizeResult: RundownSynchronizeResult = this.ingestRundownSynchronizer.synchronizeRundown(emptyRundown, ingestedRundown)
    const createdRundown: Rundown = rundownSynchronizeResult.updatedRundown ?? emptyRundown
    this.logRundownSynchronizeResult(rundownSynchronizeResult, `Creating the rundown '${createdRundown.name}' with id '${createdRundown.id}' has the following effects:`)
    this.applyRundownSynchronizeResult(createdRundown, rundownSynchronizeResult)

    const durationInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
    this.logger.trace(`Creating rundown (without IO) took ${durationInMs}ms.`)

    this.rundownEventEmitter.emitRundownCreated(createdRundown)
    await this.persistRundown(createdRundown)
    await this.actionGenerationService.generateActionsForRundown(createdRundown).catch(error => this.logger.data(error).warn(`Failed while generating actions for rundown '${createdRundown.name}' with id ${createdRundown.id}.`))
  }

  private async updateEmitAndPersistRundown(rundown: Rundown, ingestedRundown: IngestedRundown): Promise<void> {
    const startTime: bigint = process.hrtime.bigint()
    const rundownSynchronizeResult: RundownSynchronizeResult = this.ingestRundownSynchronizer.synchronizeRundown(rundown, ingestedRundown)
    const updatedRundown: Rundown = rundownSynchronizeResult.updatedRundown ?? rundown
    this.logRundownSynchronizeResult(rundownSynchronizeResult, `Synchronizing rundown '${updatedRundown.name}' with id '${updatedRundown.id}' had following effects:`)
    const { deletedPartsInfo, deletedSegmentsInfo }: DeletedInfo = this.applyRundownSynchronizeResult(updatedRundown, rundownSynchronizeResult)

    const timeSpentInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
    this.logger.trace(`Synchronizing rundown (without IO) took ${timeSpentInMs}ms.`)

    if (!this.wasRundownChanged(rundownSynchronizeResult)) {
      this.logger.debug(`No changes to save for rundown ${updatedRundown.name} with id '${updatedRundown.id}'.`)
      return
    }

    await this.persistRundown(updatedRundown)
    this.emitEventsFromRundownSynchronizeResult(updatedRundown, rundownSynchronizeResult, { deletedSegmentsInfo, deletedPartsInfo })
    await this.actionGenerationService.generateActionsForRundown(updatedRundown).catch(error => this.logger.data(error).warn(`Failed while generating actions for rundown '${updatedRundown.name}' with id ${updatedRundown.id}.`))
  }

  private logRundownSynchronizeResult(rundownSynchronizeResult: RundownSynchronizeResult, message: string): void {
    this.logger.data({
      updatedRundown: rundownSynchronizeResult.updatedRundown ? 1 : 0,
      createdSegments: rundownSynchronizeResult.createdSegments.length,
      updatedSegments: rundownSynchronizeResult.updatedSegments.length,
      deletedSegments: rundownSynchronizeResult.deletedSegments.length,
      createdParts: rundownSynchronizeResult.createdParts.length,
      updatedParts: rundownSynchronizeResult.updatedParts.length,
      deletedParts: rundownSynchronizeResult.deletedParts.length,
    }).trace(message)
  }

  private applyRundownSynchronizeResult(rundown: Rundown, rundownSynchronizeResult: RundownSynchronizeResult): DeletedInfo {
    const deletedSegmentsInfo: DeletedSegmentInfo[] = rundownSynchronizeResult.deletedSegments.map(segment => {
      const originalSegmentId: string = segment.id
      const deletedSegment: Segment | undefined = rundown.removeSegment(segment.id)
      return {
        segment: deletedSegment,
        originalSegmentId,
      }
    })
    rundownSynchronizeResult.createdSegments.forEach(segment => rundown.addSegment(segment))
    rundownSynchronizeResult.updatedSegments.forEach(segment => rundown.updateSegment(segment))

    const deletedPartsInfo: DeletedPartInfo[] = rundownSynchronizeResult.deletedParts.map(part => {
      const originalPartId: string = part.id
      const originalSegmentId: string = part.getSegmentId()
      const deletedPart: Part | undefined = rundown.removePartFromSegment(part.id)
      return {
        part: deletedPart,
        originalPartId,
        originalSegmentId,
      }
    })
    rundownSynchronizeResult.createdParts.forEach(part => rundown.addPart(part))
    rundownSynchronizeResult.updatedParts.forEach(part => rundown.updatePart(part))

    return { deletedPartsInfo, deletedSegmentsInfo }
  }

  private emitEventsFromRundownSynchronizeResult(rundown: Rundown, rundownSynchronizeResult: RundownSynchronizeResult, deletedInfo: DeletedInfo): void {
    if (rundownSynchronizeResult.updatedRundown) {
      this.rundownEventEmitter.emitRundownUpdated(rundownSynchronizeResult.updatedRundown)
    }
    deletedInfo.deletedSegmentsInfo.filter((deletedSegmentInfo): deletedSegmentInfo is Required<DeletedSegmentInfo> => deletedSegmentInfo.segment !== undefined)
      .forEach(({ segment, originalSegmentId }) => {
        segment.isUnsynced() ? this.rundownEventEmitter.emitSegmentUnsynced(rundown, segment, originalSegmentId) : this.rundownEventEmitter.emitSegmentDeleted(rundown, originalSegmentId)
      })
    rundownSynchronizeResult.createdSegments.forEach(segment => this.rundownEventEmitter.emitSegmentCreated(rundown, segment))
    rundownSynchronizeResult.updatedSegments.forEach(segment => this.rundownEventEmitter.emitSegmentUpdated(rundown, segment))

    const updatedSegmentIds: ReadonlySet<string> = new Set(rundownSynchronizeResult.updatedSegments.map(segment => segment.id))
    deletedInfo.deletedPartsInfo
      .filter((deletedPartInfo): deletedPartInfo is Required<DeletedPartInfo> => deletedPartInfo.part !== undefined && !updatedSegmentIds.has(deletedPartInfo.part.getSegmentId()))
      .forEach(({ part, originalSegmentId, originalPartId }) => {
        part.isUnsynced() ? this.rundownEventEmitter.emitPartUnsynced(rundown, part, originalPartId) : this.rundownEventEmitter.emitPartDeleted(rundown, originalSegmentId, originalPartId)
      })
    rundownSynchronizeResult.createdParts.filter(part => !updatedSegmentIds.has(part.getSegmentId())).forEach(part => this.rundownEventEmitter.emitPartCreated(rundown, part))
    rundownSynchronizeResult.updatedParts.filter(part => !updatedSegmentIds.has(part.getSegmentId())).forEach(part => this.rundownEventEmitter.emitPartUpdated(rundown, part))
  }

  private wasRundownChanged({ updatedRundown, createdSegments, updatedSegments, deletedSegments, createdParts, updatedParts, deletedParts }: RundownSynchronizeResult): boolean {
    const numberOfChanges: number = (updatedRundown ? 1 : 0) + createdSegments.length + updatedSegments.length + deletedSegments.length + createdParts.length + updatedParts.length + deletedParts.length
    return numberOfChanges > 0
  }

  private async persistRundown(rundown: Rundown): Promise<void> {
    await this.rundownRepository.saveRundown(rundown)
    if (rundown.isActive()) {
      const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
      await this.timelineRepository.saveTimeline(timeline)
      if (rundown.getSegments().length > 0) {
        this.rundownEventEmitter.emitSetNextEvent(rundown)
      }
    }
  }
}
