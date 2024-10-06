import { DataChangeService } from './interfaces/data-change-service'
import { DeletedSegment, IngestRundownSynchronizer, RundownSynchronizeResult } from './ingest-rundown-synchronizer'
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

export class SynchronizeOnlyIngestDataChangedService implements DataChangeService {

  private isSynchronizing: boolean = false
  private dataChangeEventDebounceTimerId?: NodeJS.Timeout
  private readonly affectedRundownIds: Set<string> = new Set()
  private readonly logger: Logger

  constructor(
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly rundownChangedListener: DataChangedListener<IngestedRundown>,
    private readonly segmentChangedListener: DataChangedListener<IngestedSegment>,
    private readonly partChangedListener: DataChangedListener<IngestedPart>,
    private readonly ingestRundownSynchronizer: IngestRundownSynchronizer,
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    private readonly rundownEventEmitter: RundownEventEmitter,
    logger: Logger,
  ) {
    this.logger = logger.tag(this.constructor.name)

    this.rundownChangedListener.onCreated(rundown => this.registerReceivedDataChangeEvent(rundown.id))
    this.rundownChangedListener.onUpdated(rundown => this.registerReceivedDataChangeEvent(rundown.id))
    this.rundownChangedListener.onDeleted(rundownId => this.registerReceivedDataChangeEvent(rundownId))

    this.segmentChangedListener.onCreated(segment => this.registerReceivedDataChangeEvent(segment.rundownId))
    this.segmentChangedListener.onUpdated(segment => this.registerReceivedDataChangeEvent(segment.rundownId))
    this.segmentChangedListener.onDeleted(segmentId => {
      this.segmentRepository.getSegment(segmentId)
        .then(segment => this.registerReceivedDataChangeEvent(segment.rundownId))
        .catch(error => this.logger.data(error).error(`Failed getting segment with id '${segmentId}' for delete segment event.`))
    })

    this.partChangedListener.onCreated(part => this.registerReceivedDataChangeEvent(part.rundownId))
    this.partChangedListener.onUpdated(part => this.registerReceivedDataChangeEvent(part.rundownId))
    this.partChangedListener.onDeleted(partId => {
      this.partRepository.getPart(partId)
        .then(part => this.registerReceivedDataChangeEvent(part.rundownId))
        .catch(error => this.logger.data(error).error(`Failed getting part with id '${partId}' for deleted part event.`))
    })
  }

  private registerReceivedDataChangeEvent(rundownId: string): void {
    this.affectedRundownIds.add(rundownId)
    this.clearAndStartSynchronizeTimer()
  }

  private clearAndStartSynchronizeTimer(): void {
    clearTimeout(this.dataChangeEventDebounceTimerId)
    this.dataChangeEventDebounceTimerId = setTimeout(() => {
      this.dataChangeEventDebounceTimerId = undefined
      this.synchronizeAffectedRundowns().catch(error => this.logger.data(error).error('Failed synchronizing one or more affected rundowns.'))
    }, 200)

  }

  private async synchronizeAffectedRundowns(): Promise<void> {
    if (this.isSynchronizing) {
      this.logger.trace('Trying to synchronize while synchronzing.')
      return
    }
    this.isSynchronizing = true

    const rundownId: string | undefined = [...this.affectedRundownIds][0]
    if (!rundownId) {
      this.isSynchronizing = false
      return
    }

    try {
      const startTime: bigint = process.hrtime.bigint()
      this.logger.debug(`Starting to synchronize rundown with id '${rundownId}'.`)
      await this.synchronizeRundown(rundownId)
      const timeSpendInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
      this.logger.trace(`Synchronizing changes for rundown with id '${ rundownId }' took ${ timeSpendInMs }ms.`)
    } catch (error) {
      this.logger.data(error).error(`Failed synchronizing changes for rundown with id '${rundownId}'.`)
    }

    this.affectedRundownIds.delete(rundownId)

    this.isSynchronizing = false
    setImmediate(() => {
      this.synchronizeAffectedRundowns().catch(error => this.logger.data(error).error('Failed synchronizing one or more rundowns.'))
    })
  }

  public async initialize(): Promise<void> {
    await this.synchronizeAllRundowns().catch(error => this.logger.data(error).error('Failed synchronizing all rundowns on initialization.'))
  }

  private async synchronizeAllRundowns(): Promise<void> {
    const ingestedRundownIds: readonly string[] = await this.ingestedRundownRepository.getIngestedRundownIds()
    const basicRundowns: BasicRundown[] = await this.rundownRepository.getBasicRundowns()
    const allRundownIds: ReadonlySet<string> = new Set([
      ...ingestedRundownIds,
      ...basicRundowns.map(basicRundown => basicRundown.id),
    ])
    this.logger.trace(`Synchronizing state for ${allRundownIds.size} rundowns.`)
    for (const rundownId of allRundownIds) {
      try {
        const startTime: bigint = process.hrtime.bigint()
        await this.synchronizeRundown(rundownId)
        const timeSpendInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
        this.logger.trace(`Synchronizing changes for rundown with id '${rundownId}' took ${timeSpendInMs}ms.`)
      } catch (error) {
        this.logger.data(error).error(`Failed synchronzing changes for rundown with id '${rundownId}'.`)
      }
    }
    // TODO: Generate system actions
  }

  private async synchronizeRundown(rundownId: string): Promise<void> {
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
        // TODO: Delete rundown actions
      }
      return
    }

    if (!rundown) {
      const startTime: bigint = process.hrtime.bigint()
      const emptyRundown: Rundown = this.ingestedEntityToEntityMapper.convertIngestedRundownToRundown(ingestedRundown)
      const {
        createdSegments,
        updatedSegments,
        deletedSegments,
        createdParts,
        updatedParts,
        deletedParts,
      }: RundownSynchronizeResult = this.ingestRundownSynchronizer.synchronizeRundown(emptyRundown, ingestedRundown)
      const rundown = emptyRundown
      const createdRundown = rundown
      createdSegments.forEach(segment => rundown.addSegment(segment))
      updatedSegments.forEach(segment => rundown.updateSegment(segment))
      createdParts.forEach(part => rundown.addPart(part))
      updatedParts.forEach(part => rundown.updatePart(part))
      deletedParts.forEach(part => rundown.removePartFromSegment(part.id))
      deletedSegments.map(segment => rundown.removeSegment(segment.id))
      const durationInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
      this.logger.trace(`Creating rundown (without IO) took ${durationInMs}ms.`)
      this.rundownEventEmitter.emitRundownCreated(createdRundown)
      await this.rundownRepository.saveRundown(createdRundown)
      this.logger.data({
        createdSegments: createdSegments.length,
        updatedSegments: updatedSegments.length,
        deletedSegments: deletedSegments.length,
        createdParts: createdParts.length,
        updatedParts: updatedParts.length,
        deletedParts: deletedParts.length,
      }).trace(`Creating rundown '${createdRundown.name}' with id '${createdRundown.id}' had following effects:`)

      return
    }

    const startTime: bigint = process.hrtime.bigint()
    const {
      createdSegments,
      updatedSegments,
      deletedSegments,
      createdParts,
      updatedParts,
      deletedParts,
    }: RundownSynchronizeResult = this.ingestRundownSynchronizer.synchronizeRundown(rundown, ingestedRundown)
    const updatedRundown = rundown
    this.logger.data({
      createdSegments: createdSegments.length,
      updatedSegments: updatedSegments.length,
      deletedSegments: deletedSegments.length,
      createdParts: createdParts.length,
      updatedParts: updatedParts.length,
      deletedParts: deletedParts.length,
    }).trace(`Synchronizing for rundown '${rundown.name}' with id '${rundown.id}' had following effects:`)
    createdSegments.forEach(segment => rundown.addSegment(segment))
    updatedSegments.forEach(segment => rundown.updateSegment(segment))
    createdParts.forEach(part => rundown.addPart(part))
    updatedParts.forEach(part => rundown.updatePart(part))
    deletedParts.forEach(part => rundown.removePartFromSegment(part.id))
    const deletedSegmentInfo: { segment: undefined | Segment, originalSegmentId: string }[] = deletedSegments.map(segment => {
      const removedSegment: Segment | undefined = rundown.removeSegment(segment.id)
      return {
        segment: segment,
        originalSegmentId: removedSegment?.id ?? segment.id,
      }
    })
    const durationInMs: number = Number(process.hrtime.bigint() - startTime) / 1_000_000
    this.logger.trace(`Synchronizing rundown (without IO) took ${durationInMs}ms.`)

    createdSegments.forEach(segment => this.rundownEventEmitter.emitSegmentCreated(updatedRundown, segment))
    updatedSegments.forEach(segment => this.rundownEventEmitter.emitSegmentUpdated(updatedRundown, segment))
    createdParts.forEach(part => this.rundownEventEmitter.emitPartCreated(updatedRundown, part))
    updatedParts.forEach(part => this.rundownEventEmitter.emitPartUpdated(updatedRundown, part))
    deletedParts.forEach(part => part.isUnsynced() ? this.rundownEventEmitter.emitPartUnsynced(updatedRundown, part) : this.rundownEventEmitter.emitPartDeleted(updatedRundown, part.getSegmentId(), part.id))
    deletedSegmentInfo.forEach(({ segment, originalSegmentId }) => segment?.isUnsynced() ? this.rundownEventEmitter.emitSegmentUnsynced(updatedRundown, segment, originalSegmentId) : this.rundownEventEmitter.emitSegmentDeleted(updatedRundown, originalSegmentId))

    await this.rundownRepository.saveRundown(updatedRundown)
    // TODO: Ensure that deleted segments and parts are deleted in database.
    // TODO: Build timeline if active
    // TODO: Generate actions
  }
}
