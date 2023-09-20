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
import { Blueprint } from '../../model/value-objects/blueprint'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { OnTimelineGenerateResult } from '../../model/value-objects/on-timeline-generate-result'

export class RundownTimelineService implements RundownService {
  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly adLibPieceRepository: AdLibPieceRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly rundownEventBuilder: RundownEventBuilder,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint
  ) {}

  public async activateRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.activate()

    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)

    this.emitAddInfinitePieces(rundown, [])

    const activateEvent: RundownEvent = this.rundownEventBuilder.buildActivateEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(activateEvent)

    const setNextEvent: RundownEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    this.rundownEventEmitter.emitRundownEvent(setNextEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  private async buildTimelineAndCallOnGenerate(rundown: Rundown): Promise<OnTimelineGenerateResult> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, configuration.studio)

    return this.blueprint.onTimelineGenerate(
      configuration,
      timeline,
      rundown.getActivePart(),
      rundown.getPersistentState(),
      rundown.getPreviousPart()
    )
  }

  public async deactivateRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.deactivate()
    const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

    this.timelineRepository.saveTimeline(timeline)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildDeactivateEvent])

    await this.rundownRepository.saveRundown(rundown)
  }

  private sendEvents(rundown: Rundown, buildEventCallbacks: ((rundown: Rundown) => RundownEvent)[]): void {
    buildEventCallbacks.forEach(buildEventCallback => {
      const event: RundownEvent = buildEventCallback(rundown)
      this.rundownEventEmitter.emitRundownEvent(event)
    })
  }

  private stopAutoNext(): void {
    this.callbackScheduler.stop()
  }

  public async takeNext(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const infinitePiecesBefore: Piece[] = rundown.getInfinitePieces()

    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)

    this.startAutoNext(onTimelineGenerateResult.timeline, rundownId)

    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)

    this.emitAddInfinitePieces(rundown, infinitePiecesBefore)
    // TODO: Emit if any infinite Pieces no longer exist e.g. we had a Segment infinite Piece and we changed Segment
    // TODO: Should we just emit a list of current infinite Pieces? That would be easy, but it then we would potentially emit the same pieces over and over again.

    this.sendEvents(rundown, [
      this.rundownEventBuilder.buildTakeEvent,
      this.rundownEventBuilder.buildSetNextEvent
    ])

    await this.rundownRepository.saveRundown(rundown)
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
    }
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

    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildSetNextEvent])

    await this.rundownRepository.saveRundown(rundown)
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildResetEvent])

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

    const configuration: Configuration = await this.configurationRepository.getConfiguration()

    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, configuration.studio)

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

    this.sendEvents(rundown, [this.rundownEventBuilder.buildDeletedEvent])
  }
}
