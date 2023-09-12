import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { Timeline } from '../../model/entities/timeline'
import { AdLibPieceRepository } from '../../data-access/repositories/interfaces/ad-lib-piece-repository'
import { AdLibPiece } from '../../model/entities/ad-lib-piece'
import { Piece } from '../../model/entities/piece'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { CallbackScheduler } from './interfaces/callback-scheduler'
import { RundownService } from './interfaces/rundown-service'
import {
  AdLibPieceInsertedEvent,
  InfiniteRundownPieceAddedEvent,
  RundownEvent,
} from '../../model/value-objects/rundown-event'
import { ActiveRundownException } from '../../model/exceptions/active-rundown-exception'
import { StudioRepository } from '../../data-access/repositories/interfaces/studio-repository'
import { Studio } from '../../model/entities/studio'
import { Blueprint } from '../../model/value-objects/blueprint'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { ShowStyleRepository } from '../../data-access/repositories/interfaces/show-style-repository'
import { ShowStyle } from '../../model/entities/show-style'
import { RundownPersistentState } from '../../model/value-objects/rundown-persistent-state'

// Sofie currently only uses one hardcoded studio.
const STUDIO_ID: string = 'studio0'
// Sofie currently only uses one hardcoded showStyle.
const SHOW_STYLE_ID: string = 'show0'

export class RundownTimelineService implements RundownService {
  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly adLibPieceRepository: AdLibPieceRepository,
    private readonly studioRepository: StudioRepository,
    private readonly showStyleRepository: ShowStyleRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly rundownEventBuilder: RundownEventBuilder,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint
  ) {}

  public async activateRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.activate()

    const studio: Studio = await this.studioRepository.getStudio(STUDIO_ID)

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, studio)
    this.timelineRepository.saveTimeline(timeline)

    this.emitAddInfinitePieces(rundown, [])

    const activateEvent: RundownEvent = this.rundownEventBuilder.buildActivateEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(activateEvent)

    const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(setNextEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async deactivateRundown(rundownId: string): Promise<void> {
    this.callbackScheduler.stop()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.deactivate()
    const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

    this.timelineRepository.saveTimeline(timeline)

    const deactivateEvent: RundownEvent = this.rundownEventBuilder.buildDeactivateEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(deactivateEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async takeNext(rundownId: string): Promise<void> {
    this.callbackScheduler.stop()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBefore: Piece[] = rundown.getInfinitePieces()

    rundown.takeNext()

    const endStateForActivePart: PartEndState = this.blueprint.getEndStateForPart(
      rundown.getActivePart(),
      rundown.getPreviousPart(),
      Date.now()
    )
    rundown.getActivePart().setEndState(endStateForActivePart)

    const studio: Studio = await this.studioRepository.getStudio(STUDIO_ID)
    const showStyle: ShowStyle = await this.showStyleRepository.getShowStyle(SHOW_STYLE_ID)
    showStyle.blueprintConfiguration

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, studio)

    const onTimelineGenerate: { timeline: Timeline; rundownPersistentState: RundownPersistentState } =
        this.blueprint.onTimelineGenerate(
          studio,
          {} as ShowStyle,
          rundown.getPersistentState(),
          rundown.getActivePart(),
          rundown.getPreviousPart(),
          timeline
        )
    rundown.setPersistentState(onTimelineGenerate.rundownPersistentState)

    if (timeline.autoNext) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.callbackScheduler.start(timeline.autoNext.epochTimeToTakeNext, async () => this.takeNext(rundownId))
    }

    this.timelineRepository.saveTimeline(onTimelineGenerate.timeline)

    this.emitAddInfinitePieces(rundown, infinitePiecesBefore)
    // TODO: Emit if any infinite Pieces no longer exist e.g. we had a Segment infinite Piece and we changed Segment
    // TODO: Should we just emit a list of current infinite Pieces? That would be easy, but it then we would potentially emit the same pieces over and over again.

    const takeEvent: RundownEvent = this.rundownEventBuilder.buildTakeEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(takeEvent)

    const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(setNextEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  private emitAddInfinitePieces(rundown: Rundown, infinitePiecesBefore: Piece[]): void {
    const infinitePiecesAfter: Piece[] = rundown.getInfinitePieces()
    infinitePiecesAfter
      .filter((piece) => !infinitePiecesBefore.includes(piece))
      .forEach((piece) => {
        const infinitePieceAddedEvent: InfiniteRundownPieceAddedEvent =
              this.rundownEventBuilder.buildInfiniteRundownPieceAddedEvent(rundown, piece)
        this.rundownEventEmitter.emitRundownEvent(infinitePieceAddedEvent)
      })
  }

  public async setNext(rundownId: string, segmentId: string, partId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNext(segmentId, partId)

    const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(setNextEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.callbackScheduler.stop()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    const studio: Studio = await this.studioRepository.getStudio(STUDIO_ID)

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, studio)

    this.timelineRepository.saveTimeline(timeline)

    const resetEvent: RundownEvent = this.rundownEventBuilder.buildResetEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(resetEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async executeAdLibPiece(rundownId: string, adLibPieceId: string): Promise<void> {
    // TODO: We don't need to recalculate the entire Rundown when an AdLib is added.
    // TODO: E.g. it should be enough just to add an AdLibPiece to the "ActivePartGroup"
    // TODO: An AdLibPart would require more, but the point still stand. We should aim to recalculate as little as possible.

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const adLibPiece: AdLibPiece = await this.adLibPieceRepository.getAdLibPiece(adLibPieceId)

    adLibPiece.setExecutedAt(new Date().getTime())
    rundown.adAdLibPiece(adLibPiece)

    const studio: Studio = await this.studioRepository.getStudio(STUDIO_ID)

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, studio)

    this.timelineRepository.saveTimeline(timeline)

    const adLibPieceInsertedEvent: AdLibPieceInsertedEvent = this.rundownEventBuilder.buildAdLibPieceInsertedEvent(
      rundown,
      adLibPiece
    )
    this.rundownEventEmitter.emitRundownEvent(adLibPieceInsertedEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    if (rundown.isActive()) {
      throw new ActiveRundownException('Attempted to delete an active rundown')
    }

    await this.rundownRepository.deleteRundown(rundownId)

    const deletedEvent: RundownEvent = this.rundownEventBuilder.buildDeletedEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(deletedEvent)
  }
}
