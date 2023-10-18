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
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { OnTimelineGenerateResult } from '../../model/value-objects/on-timeline-generate-result'
import { Part } from '../../model/entities/part'

export class RundownTimelineService implements RundownService {
  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly rundownRepository: RundownRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint
  ) {}

  public async activateRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.activate()

    await this.buildAndPersistTimeline(rundown)

    this.emitAddInfinitePieces(rundown, [])

    this.rundownEventEmitter.emitActivateEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.rundownRepository.saveRundown(rundown)
  }

  private buildAndPersistTimeline(rundown: Rundown): Promise<Timeline> {
    return rundown.isActivePartSet()
      ? this.buildAndPersistTimelineWithBlueprint(rundown)
      : this.buildAndPersistTimelineWithoutBlueprint(rundown)
  }

  private async buildAndPersistTimelineWithoutBlueprint(rundown: Rundown): Promise<Timeline> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, configuration.studio)
    this.timelineRepository.saveTimeline(timeline)
    return timeline
  }

  private async buildAndPersistTimelineWithBlueprint(rundown: Rundown): Promise<Timeline> {
    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    this.timelineRepository.saveTimeline(onTimelineGenerateResult.timeline)
    return onTimelineGenerateResult.timeline
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

    this.rundownEventEmitter.emitDeactivateEvent(rundown)

    await this.rundownRepository.saveRundown(rundown)
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

    const timeline: Timeline = await this.buildAndPersistTimeline(rundown)

    this.startAutoNext(timeline, rundownId)

    this.emitAddInfinitePieces(rundown, infinitePiecesBefore)
    // TODO: Emit if any infinite Pieces no longer exist e.g. we had a Segment infinite Piece and we changed Segment
    // TODO: Should we just emit a list of current infinite Pieces? That would be easy, but it then we would potentially emit the same pieces over and over again.

    this.rundownEventEmitter.emitTakeEvent(rundown)
    this.rundownEventEmitter.emitSetNextEvent(rundown)

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
      .forEach((piece) => this.rundownEventEmitter.emitInfiniteRundownPieceAddedEvent(rundown, piece))
  }

  public async setNext(rundownId: string, segmentId: string, partId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNext(segmentId, partId)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitSetNextEvent(rundown)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitResetEvent(rundown)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    if (rundown.isActive()) {
      throw new ActiveRundownException('Attempted to delete an active rundown')
    }

    await this.rundownRepository.deleteRundown(rundownId)

    this.rundownEventEmitter.emitDeletedEvent(rundown)
  }

  public async insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part)
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitPartInsertedAsOnAirEvent(rundown, part)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part)

    await this.buildAndPersistTimeline(rundown)

    this.rundownEventEmitter.emitPartInsertedAsNextEvent(rundown, part)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPieceAsOnAir(rundownId: string, piece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPieceIntoActivePart(piece)

    await this.buildAndPersistTimeline(rundown)

    const segmentId: string = rundown.getActiveSegment().id
    this.rundownEventEmitter.emitPieceInsertedEvent(rundown, segmentId, piece)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPieceAsNext(rundownId: string, piece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPieceIntoNextPart(piece)

    await this.buildAndPersistTimeline(rundown)

    const segmentId: string = rundown.getNextSegment().id
    this.rundownEventEmitter.emitPieceInsertedEvent(rundown, segmentId, piece)

    await this.rundownRepository.saveRundown(rundown)
  }
}
