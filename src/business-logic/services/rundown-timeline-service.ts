import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { TimelineRepository } from '../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { Timeline } from '../../model/entities/timeline'
import { Piece } from '../../model/entities/piece'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { CallbackScheduler } from './interfaces/callback-scheduler'
import { RundownService } from './interfaces/rundown-service'
import {
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PieceInsertedEvent,
  RundownDeletedEvent,
  RundownEvent,
  RundownInfinitePieceAddedEvent,
} from '../../model/value-objects/rundown-event'
import { ActiveRundownException } from '../../model/exceptions/active-rundown-exception'
import { Blueprint } from '../../model/value-objects/blueprint'
import { PartEndState } from '../../model/value-objects/part-end-state'
import { Part } from '../../model/entities/part'
import { Owner } from '../../model/enums/owner'
import { PartRepository } from '../../data-access/repositories/interfaces/part-repository'
import { Segment } from '../../model/entities/segment'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { PieceRepository } from '../../data-access/repositories/interfaces/piece-repository'

export class RundownTimelineService implements RundownService {
  constructor(
    private readonly rundownEventEmitter: RundownEventEmitter,
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly partRepository: PartRepository,
    private readonly pieceRepository: PieceRepository,
    private readonly timelineRepository: TimelineRepository,
    private readonly timelineBuilder: TimelineBuilder,
    private readonly rundownEventBuilder: RundownEventBuilder,
    private readonly callbackScheduler: CallbackScheduler,
    private readonly blueprint: Blueprint
  ) {}

  public async activateRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.activate()

    await this.buildAndPersistTimeline(rundown)

    this.emitAddInfinitePieces(rundown, [])

    this.sendEvents(rundown, [
      this.rundownEventBuilder.buildActivateEvent,
      this.rundownEventBuilder.buildSetNextEvent
    ])

    await this.rundownRepository.saveRundown(rundown)
  }

  private async buildAndPersistTimeline(rundown: Rundown): Promise<Timeline> {
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown)
    await this.timelineRepository.saveTimeline(timeline)
    return timeline
  }

  public async deactivateRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    rundown.deactivate()
    const timeline: Timeline = this.timelineBuilder.getBaseTimeline()

    await this.timelineRepository.saveTimeline(timeline)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildDeactivateEvent])

    await this.rundownRepository.saveRundown(rundown)

    await this.deleteAllUnsynced()
  }

  private async deleteAllUnsynced(): Promise<void> {
    await Promise.all([
      this.segmentRepository.deleteAllUnsyncedSegments(),
      this.partRepository.deleteAllUnsyncedParts(),
      this.pieceRepository.deleteAllUnsyncedPieces()
    ])
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

    const timeline: Timeline = await this.buildAndPersistTimeline(rundown)

    this.startAutoNext(timeline, rundownId)

    this.emitAddInfinitePieces(rundown, infinitePiecesBefore)
    // TODO: Emit if any infinite Pieces no longer exist e.g. we had a Segment infinite Piece and we changed Segment
    // TODO: Should we just emit a list of current infinite Pieces? That would be easy, but it then we would potentially emit the same pieces over and over again.

    this.sendEvents(rundown, [
      this.rundownEventBuilder.buildTakeEvent,
      this.rundownEventBuilder.buildSetNextEvent
    ])

    await this.rundownRepository.saveRundown(rundown)

    await this.deleteUnsyncedSegmentsAndParts(rundown)
  }

  private async deleteUnsyncedSegmentsAndParts(rundown: Rundown): Promise<void> {
    const unsyncedSegments: Segment[] = rundown.getSegments().filter(segment => segment.isUnsynced())
    await Promise.all(unsyncedSegments.map(async segment => {
      if (rundown.isActive() && segment.isOnAir()) {
        await this.partRepository.deleteUnsyncedPartsForSegment(segment.id)
        return
      }
      await this.segmentRepository.deleteUnsyncedSegmentsForRundown(rundown.id)
    }))
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
    }
  }

  private emitAddInfinitePieces(rundown: Rundown, infinitePiecesBefore: Piece[]): void {
    const infinitePiecesAfter: Piece[] = rundown.getInfinitePieces()
    infinitePiecesAfter
      .filter((piece) => !infinitePiecesBefore.includes(piece))
      .forEach((piece) => {
        const infinitePieceAddedEvent: RundownInfinitePieceAddedEvent =
              this.rundownEventBuilder.buildInfiniteRundownPieceAddedEvent(rundown, piece)
        this.rundownEventEmitter.emitRundownEvent(infinitePieceAddedEvent)
      })
  }

  public async setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.setNext(segmentId, partId, owner)

    await this.buildAndPersistTimeline(rundown)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildSetNextEvent])

    await this.rundownRepository.saveRundown(rundown)
  }

  public async resetRundown(rundownId: string): Promise<void> {
    this.stopAutoNext()

    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.reset()

    await this.buildAndPersistTimeline(rundown)

    this.sendEvents(rundown, [this.rundownEventBuilder.buildResetEvent])

    await this.rundownRepository.saveRundown(rundown)
  }

  public async deleteRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)

    if (rundown.isActive()) {
      throw new ActiveRundownException(`Unable to delete active Rundown: ${rundown.id}`)
    }

    await this.rundownRepository.deleteRundown(rundownId)

    const rundownDeletedEvent: RundownDeletedEvent = this.rundownEventBuilder.buildRundownDeletedEvent(rundownId)
    this.rundownEventEmitter.emitRundownEvent(rundownDeletedEvent)
  }

  public async insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part)
    rundown.takeNext()
    rundown.getActivePart().setEndState(this.getEndStateForActivePart(rundown))

    await this.buildAndPersistTimeline(rundown)

    const partInsertedEvent: PartInsertedAsOnAirEvent = this.rundownEventBuilder.buildPartInsertedAsOnAirEvent(rundown, part)
    this.rundownEventEmitter.emitRundownEvent(partInsertedEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPartAsNext(part)

    await this.buildAndPersistTimeline(rundown)

    const partInsertedEvent: PartInsertedAsNextEvent = this.rundownEventBuilder.buildPartInsertedAsNextEvent(rundown, part)
    this.rundownEventEmitter.emitRundownEvent(partInsertedEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPieceAsOnAir(rundownId: string, piece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPieceIntoActivePart(piece)

    await this.buildAndPersistTimeline(rundown)

    const pieceInsertedEvent: PieceInsertedEvent = this.rundownEventBuilder.buildPieceInsertedEvent(rundown, piece)
    this.rundownEventEmitter.emitRundownEvent(pieceInsertedEvent)

    await this.rundownRepository.saveRundown(rundown)
  }

  public async insertPieceAsNext(rundownId: string, piece: Piece): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    rundown.insertPieceIntoNextPart(piece)

    await this.buildAndPersistTimeline(rundown)

    const pieceInsertedEvent: PieceInsertedEvent = this.rundownEventBuilder.buildPieceInsertedEvent(rundown, piece)
    this.rundownEventEmitter.emitRundownEvent(pieceInsertedEvent)

    await this.rundownRepository.saveRundown(rundown)
  }
}
