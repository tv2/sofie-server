import { RundownEventEmitter } from '../rundown-event-emitter'
import { RundownRepository } from '../../domain/repositories/rundown-repository'
import { Rundown } from '../../domain/entities/rundown'
import { TimelineRepository } from '../../domain/repositories/timeline-repository'
import { TimelineBuilder } from '../../../business-logic/services/interfaces/timeline-builder'
import { Timeline } from '../../domain/entities/timeline'
import { Piece } from '../../domain/entities/piece'
import { CallbackScheduler } from '../../../cross-cutting-concerns/application/callback-scheduler'
import { RundownService } from '../rundown-service'
import { ActiveRundownException } from '../../domain/exceptions/active-rundown-exception'
import { Blueprint } from '../../domain/value-objects/blueprint'
import { PartEndState } from '../../domain/value-objects/part-end-state'
import { Part } from '../../domain/entities/part'
import { Owner } from '../../domain/enums/owner'
import { InTransition } from '../../domain/value-objects/in-transition'
import { AlreadyActivatedException } from '../../domain/exceptions/already-activated-exception'
import { IngestedRundownRepository } from '../../../sofie-ingest/domain/repositories/ingested-rundown-repository'
import { RundownMode } from '../../domain/enums/rundown-mode'
import { AlreadyRehearsalException } from '../../domain/exceptions/already-rehearsal-exception'
import { IngestService } from '../../../sofie-ingest/application/ingest-service'
import { Logger } from '../../../cross-cutting-concerns/application/logger'
import { PlayoutService } from '../playout-service'
import { TakeIsBlockedException } from '../../domain/exceptions/take-is-blocked-exception'
import { RundownCursor } from '../../domain/value-objects/rundown-cursor'
import { SetNextDirection } from '../../domain/enums/set-next-direction'
import { TakeMode } from '../../domain/enums/take-mode'
import { PlayoutContentUpdateService } from '../playout-content-service'

export class RundownTimelineService implements RundownService {
  private readonly logger: Logger

  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly ingestedRundownRepository: IngestedRundownRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly ingestService: IngestService,
    private readonly playoutService: PlayoutService,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint,
    private readonly playoutContentService: PlayoutContentUpdateService,
    logger: Logger,
  ) {
    this.logger = logger.tag(this.constructor.name)
  }

  public async setTakeMode(rundownId: string, takeMode: TakeMode): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    if (takeMode === rundown.getTakeMode()) {
      this.logger.debug(`Rundown: ${rundown.id} already has a takeMode of ${takeMode}.`)
      return
    }
    rundown.setTakeMode(takeMode)
    this.rundownEventEmitter.emitRundownUpdated(rundown)
    await this.saveRundown(rundown)
  }

  public async activateRundown(rundownId: string): Promise<void> {
    await this.assertNoRundownIsActive()
    await this.assertNoRundownIsInRehearsal(rundownId)

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeActivation: Map<string, Piece> = rundown.getInfinitePiecesMap()
    const rundownModeBeforeActivation: RundownMode = rundown.getMode()

    rundown.activate()

    await this.buildAndPersistTimeline(rundown)
    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeActivation)
    this.rundownEventEmitter.emitActivateEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.saveRundown(rundown)

    const okToDestroyStuff: boolean = rundownModeBeforeActivation !== RundownMode.REHEARSAL
    this.playoutService.makeDevicesReady(okToDestroyStuff, rundown.id).catch(error => this.logger.data(error).warn(`Request for making devices ready failed when entering active mode for rundown '${rundown.name}' with id '${rundown.id}'.`))
  }

  public async enterRehearsal(rundownId: string): Promise<void> {
    await this.assertNoRundownIsActive()
    await this.assertNoRundownIsInRehearsal()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBeforeRehearsal: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.enterRehearsal()

    await this.buildAndPersistTimeline(rundown)
    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeRehearsal)
    this.rundownEventEmitter.emitRehearseEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.saveRundown(rundown)

    const okToDestroyStuff: boolean = true // It's always "ok to destroy stuff" when we enter rehearsal.
    this.playoutService.makeDevicesReady(okToDestroyStuff, rundown.id).catch(error => this.logger.data(error).warn(`Request for making devices ready failed when entering rehearsal mode for rundown '${rundown.name}' with id '${rundown.id}'.`))
  }

  private async saveRundown(rundown: Rundown): Promise<void> {
    await this.playoutContentService.updatePlayoutContentState(rundown)
    await this.rundownRepository.saveRundown(rundown)
  }

  private async assertNoRundownIsActive(): Promise<void> {
    (await this.rundownRepository.getBasicRundowns()).forEach(rundown => {
      if (rundown.getMode() === RundownMode.ACTIVE) {
        throw new AlreadyActivatedException(`Unable to do action. Rundown ${rundown.name} is already active.`)
      }
    })
  }

  private async assertNoRundownIsInRehearsal(rundownIdExemptFromRehearsalCheck?: string): Promise<void> {
    (await this.rundownRepository.getBasicRundowns()).forEach(rundown => {
      if (rundown.id === rundownIdExemptFromRehearsalCheck) {
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

    this.playoutService.makeDevicesStandDown().catch(error => this.logger.data(error).warn(`Request for making devices stand down failed when deactivating rundown '${rundown.name}' with id '${rundown.id}'.`))
  }

  private stopAutoNext(): void {
    this.callbackScheduler.stop()
  }

  public async takeNext(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    await this.takeNextBuildEmitAndSave(rundown)
  }

  private async takeNextBuildEmitAndSave(rundown: Rundown): Promise<void> {
    this.assertTakeIsNotBlocked(rundown)

    this.stopAutoNext()

    const infinitePiecesBeforeTakeNext: Map<string, Piece> = rundown.getInfinitePiecesMap()
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    let recallPart: Part | undefined
    if (this.shouldRecallPart(rundown)) {
      recallPart = this.recallPreviousPart(rundown)
    }

    const timeline: Timeline = await this.buildAndPersistTimeline(rundown)

    this.emitIfInfinitePiecesHasChanged(rundown, infinitePiecesBeforeTakeNext)
    this.rundownEventEmitter.emitTakeEvent(rundown)

    if (recallPart){
      this.rundownEventEmitter.emitPartInsertedAsNextEvent(rundown, recallPart)
    }

    this.rundownEventEmitter.emitSetNextEvent(rundown)
    this.startAutoNext(timeline, rundown.id)

    this.emitDeleteUnsyncedPreviousPart(rundown)
    this.deleteUnsyncedSegments(rundown)
    await this.saveRundown(rundown)

    if (rundown.getActiveSegment().definesShowStyleVariant) {
      this.ingestService.reloadIngestData(rundown.id).catch(error => this.logger.data(error).warn(`Request for reloading ingest data failed for rundown '${rundown.name}' with id '${rundown.id}'.`))
    }
  }

  private shouldRecallPart(rundown: Rundown): boolean {
    return rundown.getTakeMode() === TakeMode.RECALL
  }

  private recallPreviousPart(rundown: Rundown): Part | undefined {
    const previousPart: Part | undefined = rundown.getPreviousPart()
    if (!previousPart) {
      return undefined
    }
    const recallPart: Part = previousPart.getStrippedClone()
    rundown.insertPartAsNext(recallPart)
    return recallPart
  }

  private assertTakeIsNotBlocked(rundown: Rundown): void {
    let onAirPart: Part

    try {
      onAirPart = rundown.getActivePart()
    } catch (error) {
      // If 'getActivePart()' throws it means that we don't have any active Part yet which means the Take is not blocked - hence we can simply return.
      return
    }
    if (Date.now() < onAirPart.getExecutedAt() + onAirPart.getInTransition().blockTakeDuration) {
      throw new TakeIsBlockedException('Unable to do Take while in a Transition')
    }
  }

  private emitDeleteUnsyncedPreviousPart(rundown: Rundown): void {
    const previousPart: Part | undefined = rundown.getPreviousPart()
    if (previousPart && previousPart.isUnsynced()) {
      this.rundownEventEmitter.emitPartDeleted(rundown, previousPart.getSegmentId(), previousPart.id)
    }
  }

  private deleteUnsyncedSegments(rundown: Rundown): void {
    rundown.getSegments()
      .filter(segment => segment.isUnsynced() && !segment.isOnAir())
      .forEach(segment => {
        rundown.removeUnsyncedSegment(segment)
        this.rundownEventEmitter.emitSegmentDeleted(rundown, segment.id)
      })
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
      this.callbackScheduler.start(timeline.autoNext.epochTimeToTakeNext, () => {
        this.takeNext(rundownId)
          .catch(error => this.logger.data(error).error('Failed executing take with auto next:'))
      })
    }
  }

  public async setNextFromIds(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNextFromIds(segmentId, partId, owner)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitSetNextEvent(rundown)

    this.deleteUnplayedUnplannedPartsFromActiveSegment(rundown)
    await this.saveRundown(rundown)
  }

  public async setNextFromDirection(rundownId: string, direction: SetNextDirection, owner?: Owner): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNextFromDirection(direction, owner)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitSetNextEvent(rundown)

    this.deleteUnplayedUnplannedPartsFromActiveSegment(rundown)
    await this.saveRundown(rundown)
  }

  private deleteUnplayedUnplannedPartsFromActiveSegment(rundown: Rundown): void {
    if (!rundown.isActivePartSet()) {
      return
    }
    rundown.getActiveSegment().getParts().forEach(part => {
      if (!part.isPlanned && !part.isNext() && part.getExecutedAt() === 0) {
        rundown.removePartFromSegment(part.id)
        this.rundownEventEmitter.emitPartDeleted(rundown, part.getSegmentId(), part.id)
      }
    })
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitResetEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

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
    this.assertTakeIsNotBlocked(rundown)

    const unplannedNextPartToKeepAsNextPart: Part | undefined = !rundown.getNextPart().isPlanned ? rundown.getNextPart() : undefined
    const nextCursor: RundownCursor | undefined = rundown.getNextCursor()

    rundown.insertPartAsNext(part)
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    if (unplannedNextPartToKeepAsNextPart) {
      rundown.insertPartAsNext(unplannedNextPartToKeepAsNextPart)
    } else if (nextCursor) {
      rundown.setNextFromIds(nextCursor.segment.id, nextCursor.part.id, nextCursor.owner)
    }

    await this.buildAndPersistTimeline(rundown)

    const prunedPartIds: string[] = rundown.pruneOldUnplannedPartsOnActiveSegment()
    if (prunedPartIds.length > 0) {
      this.rundownEventEmitter.emitSegmentUpdated(rundown, rundown.getActiveSegment())
    } else if (rundown.getActivePart().id === part.id) {
      this.rundownEventEmitter.emitPartInsertedAsOnAirEvent(rundown, part)
    }

    await this.saveRundown(rundown)
  }

  public async insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part, Owner.EXTERNAL)

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
    this.insertPieceAsNextAndEmit(rundown, piece, partInTransition)

    await this.buildAndPersistTimeline(rundown)
    await this.saveRundown(rundown)
  }

  private insertPieceAsNextAndEmit(rundown: Rundown, piece: Piece, partInTransition?: InTransition): void {
    rundown.insertPieceIntoNextPart(piece, partInTransition, Owner.EXTERNAL)
    this.rundownEventEmitter.emitPartUpdated(rundown, rundown.getNextPart())
  }

  public async insertPieceAsNextAndTake(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    this.insertPieceAsNextAndEmit(rundown, piece, partInTransition)
    await this.takeNextBuildEmitAndSave(rundown)
  }

  public async replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.replacePiece(pieceToBeReplaced, newPiece)
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    await this.buildAndPersistTimeline(rundown)

    const segmentId: string = pieceToBeReplaced.getPartId() === rundown.getActivePart().id
      ? rundown.getActiveSegment().id
      : rundown.getNextSegment().id

    this.rundownEventEmitter.emitPieceReplacedEvent(rundown, segmentId, pieceToBeReplaced.id, newPiece)

    await this.saveRundown(rundown)
  }

  public async stopPiece(rundownId: string, pieceId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const stoppedPiece: Piece | undefined = rundown.stopPiece(pieceId)
    if (!stoppedPiece) {
      return
    }
    await this.buildAndPersistTimeline(rundown)
    this.rundownEventEmitter.emitPieceStoppedEvent(rundown, rundown.getActivePart().getSegmentId(), stoppedPiece)
    await this.saveRundown(rundown)
  }
}
