import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { Timeline } from '../../model/entities/timeline'
import { Piece } from '../../model/entities/piece'
import { CallbackScheduler } from './interfaces/callback-scheduler'
import { RundownService } from './interfaces/rundown-service'
import { ActiveRundownException } from '../../model/exceptions/active-rundown-exception'
import { Blueprint } from '../../model/value-objects/blueprint'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Part } from '../../model/entities/part'
import { Owner } from '../../model/enums/owner'
import { PartRepository } from '../../data-access/repositories/interfaces/part-repository'
import { Segment } from '../../model/entities/segment'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { PieceRepository } from '../../data-access/repositories/interfaces/piece-repository'
import { InTransition } from '../../model/value-objects/in-transition'
import { AlreadyActivatedException } from '../../model/exceptions/already-activated-exception'
import { IngestedRundownRepository } from '../../data-access/repositories/interfaces/ingested-rundown-repository'
import { RundownMode } from '../../model/enums/rundown-mode'
import { AlreadyRehearsalException } from '../../model/exceptions/already-rehearsal-exception'

export class RundownTimelineService implements RundownService {
  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly pieceRepository: PieceRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint
  ) {}

  public async activateRundown(rundownId: string): Promise<void> {
    await this.assertNoRundownIsActiveOrInRehearsal(rundownId)
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeActivation: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.activate()

    await this.buildAndPersistTimeline(rundown)
    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeActivation)
    this.rundownEventEmitter.emitActivateEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.saveRundown(rundown)
  }

  public async enterRehearsalOnRundown(rundownId: string): Promise<void> {
    await this.assertNoRundownIsActiveOrInRehearsal()
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeRehearsal: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.enterRehearsal()

    await this.buildAndPersistTimeline(rundown)
    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeRehearsal)
    this.rundownEventEmitter.emitRehearsalEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.saveRundown(rundown)
  }

  private async saveRundown(rundown: Rundown): Promise<void> {
    await this.rundownRepository.saveRundown(rundown)
  }

  private async assertNoRundownIsActiveOrInRehearsal(rundownIdExemptFromRehearsalCheck?: string): Promise<void> {
    (await this.rundownRepository.getBasicRundowns()).forEach(rundown => {
      if (rundown.getMode() === RundownMode.ACTIVE) {
        throw new AlreadyActivatedException(`Unable to do action. Rundown ${rundown.name} is already active.`)
      }
      if (!!rundownIdExemptFromRehearsalCheck && rundown.id === rundownIdExemptFromRehearsalCheck) {
        return
      }
      if (rundown.getMode() === RundownMode.REHEARSAL) {
        throw new AlreadyRehearsalException(`Unable to do action. Rundown ${rundown.name} is already in rehearsal.`)
      }
    })
  }

  private async buildAndPersistTimeline(rundown: Rundown): Promise<Timeline> {
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
    return timeline
  }

  private emitIfInfinitePiecesHasChanged(rundown: Rundown, infinitePiecesBefore: Map<string, Piece>): void {
    if (this.doInfinitePieceMapsDiffer(infinitePiecesBefore, rundown.getInfinitePiecesMap())) {
      this.rundownEventEmitter.emitInfinitePiecesUpdatedEvent(rundown)
    }
  }

  private doInfinitePieceMapsDiffer(firstInfinitePieceMap: Map<string, Piece>, secondInfinitePieceMap: Map<string, Piece>): boolean {
    if (firstInfinitePieceMap.size !== secondInfinitePieceMap.size) {
      return true
    }
    return [...firstInfinitePieceMap.entries()].some(([layer, piece]) => secondInfinitePieceMap.get(layer)?.id !== piece.id)
  }

  public async deactivateRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.deactivate()
    const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

    await this.timelineRepository.saveTimeline(timeline)

    this.rundownEventEmitter.emitDeactivateEvent(rundown)

    await this.saveRundown(rundown)

    await this.deleteAllUnsyncedAndUnplanned()
  }

  private async deleteAllUnsyncedAndUnplanned(): Promise<void> {
    await Promise.all([
      this.segmentRepository.deleteAllUnsyncedSegments(),
      this.partRepository.deleteAllUnsyncedParts(),
      this.pieceRepository.deleteAllUnsyncedPieces(),
      this.partRepository.deleteAllUnplannedParts(),
      this.pieceRepository.deleteAllUnplannedPieces(),
    ])
  }

  private stopAutoNext(): void {
    this.callbackScheduler.stop()
  }

  public async takeNext(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeTakeNext: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    const timeline: Timeline = await this.buildAndPersistTimeline(rundown)

    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeTakeNext)
    this.rundownEventEmitter.emitTakeEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)
    this.startAutoNext(timeline, rundownId)

    await this.deleteUnsyncedPreviousPart(rundown)
    await this.deleteUnsyncedSegments(rundown)
    await this.saveRundown(rundown)
  }

  private async deleteUnsyncedPreviousPart(rundown: Rundown): Promise<void> {
    const previousPart: Part | undefined = rundown.getPreviousPart()
    if (previousPart && previousPart.isUnsynced()) {
      await this.partRepository.delete(previousPart.id)
      this.rundownEventEmitter.emitPartDeleted(rundown, previousPart.getSegmentId(), previousPart.id)
    }
  }

  private async deleteUnsyncedSegments(rundown: Rundown): Promise<void> {
    const unsyncedSegments: Segment[] = rundown.getSegments().filter(segment => segment.isUnsynced())
    await Promise.all(
      unsyncedSegments.map(async segment => {
        if (rundown.isActive() && segment.isOnAir()) {
          await this.partRepository.deleteUnsyncedPartsForSegment(segment.id)
          return
        }
        if (!segment.isOnAir()) {
          rundown.removeUnsyncedSegment(segment)
          this.rundownEventEmitter.emitSegmentDeleted(rundown, segment.id)
        }
        await this.segmentRepository.deleteUnsyncedSegmentsForRundown(rundown.id)
      })
    )
    await this.pieceRepository.deleteUnsyncedInfinitePiecesNotOnAnyRundown()
  }

  private getEndStateForActivePart(rundown: Rundown): PartEndState {
    return this.blueprint.getEndStateForPart(
      rundown.getActivePart(),
      rundown.getPreviousPart(),
      Date.now(),
      undefined
    )
  }

  private startAutoNext(timeline: Timeline, rundownId: string): void {
    if (timeline.autoNext) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.callbackScheduler.start(timeline.autoNext.epochTimeToTakeNext, async () => this.takeNext(rundownId))
      this.rundownEventEmitter.emitAutoNextStarted(rundownId)
    }
  }

  public async setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNext(segmentId, partId, owner)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.saveRundown(rundown)
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitResetEvent(rundown)

    await this.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    if (rundown.isActive()) {
      throw new ActiveRundownException(`Unable to delete active Rundown: ${rundown.id}`)
    }

    await this.ingestedRundownRepository.deleteIngestedRundown(rundownId)

    this.rundownEventEmitter.emitRundownDeleted(rundown.id)
  }

  public async insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const unplannedNextPartToKeepAsNextPart: Part | undefined = !rundown.getNextPart().isPlanned ? rundown.getNextPart() : undefined

    rundown.insertPartAsNext(part)
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    if (unplannedNextPartToKeepAsNextPart) {
      rundown.insertPartAsNext(unplannedNextPartToKeepAsNextPart)
    }

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitPartInsertedAsOnAirEvent(rundown, part)

    await this.saveRundown(rundown)
  }

  public async insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitPartInsertedAsNextEvent(rundown, part)

    await this.saveRundown(rundown)
  }

  public async insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn: string[] = []): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeInsertPieceAsOnAir: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.stopActivePiecesOnLayers(layersToStopPiecesOn)
    rundown.insertPieceIntoActivePart(piece)
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    await this.buildAndPersistTimeline(rundown)

    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeInsertPieceAsOnAir)
    this.rundownEventEmitter.emitPartUpdated(rundown, rundown.getActivePart())

    await this.saveRundown(rundown)
  }

  public async insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPieceIntoNextPart(piece, partInTransition)

    await this.buildAndPersistTimeline(rundown)

    const segmentId: string = rundown.getNextSegment().id
    this.rundownEventEmitter.emitPieceInsertedEvent(rundown, segmentId, piece)

    await this.saveRundown(rundown)
  }

  public async replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.replacePiece(pieceToBeReplaced, newPiece)
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    await this.buildAndPersistTimeline(rundown)

    const segmentId: string = pieceToBeReplaced.getPartId() === rundown.getActivePart().id
      ? rundown.getActiveSegment().id
      : rundown.getNextSegment().id
    this.rundownEventEmitter.emitPieceInsertedEvent(rundown, segmentId, newPiece)

    await this.saveRundown(rundown)
  }
}
