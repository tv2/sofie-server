import {
  BulkIngestEvent,
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUnsyncedEvent,
  PartUpdatedEvent,
  PieceInsertedEvent,
  PieceReplacedEvent,
  RundownActivatedEvent,
  RundownCreatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownEvent,
  RundownInfinitePiecesUpdatedEvent,
  RundownRehearseEvent,
  RundownResetEvent,
  RundownUpdatedEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentUnsyncedEvent,
  SegmentUpdatedEvent,
} from '../value-objects/rundown-event'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { Rundown } from '../../model/entities/rundown'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { Segment } from '../../model/entities/segment'
import { RundownEventObserver } from '../interfaces/rundown-event-observer'

const BULK_EVENT_THRESHOLD_IN_MS: number = 500
const MAX_TIME_BEFORE_SENDING_BULK_EVENT_IN_MS: number = 5000

export class RundownEventService implements RundownEventEmitter, RundownEventObserver {
  private static instance: RundownEventService

  public static getInstance(rundownEventBuilder: RundownEventBuilder): RundownEventService {
    if (!this.instance) {
      this.instance = new RundownEventService(rundownEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((rundownEvent: RundownEvent) => void)[] = []

  private ingestEventQueue: Map<string, RundownEvent[]> = new Map()

  private ingestTimeoutIdentifier?: NodeJS.Timeout
  private callbackStartedTimestamp: number
  private lastBulkEmittedTimestamp: number

  private lastSetNextEventReceivedDuringIngest?: PartSetAsNextEvent

  private constructor(private readonly rundownEventBuilder: RundownEventBuilder) {}

  private emitRundownEvent(rundownEvent: RundownEvent): void {
    this.callbacks.forEach(callback => callback(rundownEvent))
  }

  private queueIngestEvent(rundownEvent: RundownEvent): void {
    if (!this.ingestEventQueue.get(rundownEvent.rundownId)) {
      this.ingestEventQueue.set(rundownEvent.rundownId, [])
    }
    this.ingestEventQueue.get(rundownEvent.rundownId)?.push(rundownEvent)

    this.startBulkEventCallback()
  }

  private startBulkEventCallback(): void {
    const isTimeoutStarted: boolean = !!this.ingestTimeoutIdentifier
    const isBulkEmitEventOverdue: boolean = Date.now() > this.lastBulkEmittedTimestamp + MAX_TIME_BEFORE_SENDING_BULK_EVENT_IN_MS
    const isTooLateToDelayBulkEvent: boolean = Date.now() > this.callbackStartedTimestamp + BULK_EVENT_THRESHOLD_IN_MS

    if (isTimeoutStarted && (isBulkEmitEventOverdue || isTooLateToDelayBulkEvent)) {
      return
    }

    clearTimeout(this.ingestTimeoutIdentifier)
    this.callbackStartedTimestamp = Date.now()
    this.ingestTimeoutIdentifier = setTimeout(() => {
      this.ingestTimeoutIdentifier = undefined
      this.sendBulkIngestEvent()
    }, BULK_EVENT_THRESHOLD_IN_MS)
  }

  private sendBulkIngestEvent(): void {
    const bulkIngestEvents: BulkIngestEvent[] = []
    for (const [rundownId, ingestEvents] of this.ingestEventQueue) {
      bulkIngestEvents.push(this.rundownEventBuilder.buildBulkIngestEvent(rundownId, ingestEvents))
    }
    this.ingestEventQueue = new Map()
    this.lastBulkEmittedTimestamp = Date.now()
    this.callbacks.forEach(callback => bulkIngestEvents.forEach(bulkEvent => callback(bulkEvent)))
  }

  public emitActivateEvent(rundown: Rundown): void {
    const event: RundownActivatedEvent = this.rundownEventBuilder.buildActivateEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitRehearseEvent(rundown: Rundown): void {
    const event: RundownRehearseEvent = this.rundownEventBuilder.buildRehearseEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitDeactivateEvent(rundown: Rundown): void {
    const event: RundownDeactivatedEvent = this.rundownEventBuilder.buildDeactivateEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitInfinitePiecesUpdatedEvent(rundown: Rundown): void {
    const event: RundownInfinitePiecesUpdatedEvent = this.rundownEventBuilder.buildInfinitePiecesUpdatedEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitPartInsertedAsNextEvent(rundown: Rundown, part: Part): void {
    const event: PartInsertedAsNextEvent = this.rundownEventBuilder.buildPartInsertedAsNextEvent(rundown, part)
    this.emitRundownEvent(event)
  }

  public emitPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): void {
    const event: PartInsertedAsOnAirEvent = this.rundownEventBuilder.buildPartInsertedAsOnAirEvent(rundown, part)
    this.emitRundownEvent(event)
  }

  public emitPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): void {
    const event: PieceInsertedEvent = this.rundownEventBuilder.buildPieceInsertedEvent(rundown, segmentId, piece)
    this.emitRundownEvent(event)
  }

  public emitPieceReplacedEvent(rundown: Rundown, segmentId: string, replacedPieceId: string, newPiece: Piece): void {
    const event: PieceReplacedEvent = this.rundownEventBuilder.buildPieceReplacedEvent(rundown, segmentId, replacedPieceId, newPiece)
    this.emitRundownEvent(event)
  }

  public emitResetEvent(rundown: Rundown): void {
    const event: RundownResetEvent = this.rundownEventBuilder.buildResetEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitSetNextEvent(rundown: Rundown): void {
    const event: PartSetAsNextEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    if (this.ingestTimeoutIdentifier) { // We are currently ingesting
      if (this.lastSetNextEventReceivedDuringIngest?.segmentId === event.segmentId && this.lastSetNextEventReceivedDuringIngest.partId === event.partId) {
        // The next Segment and Part did not change, so we don't need to send a new SetNext event.
        return
      }
      this.lastSetNextEventReceivedDuringIngest = event
    }

    this.emitRundownEvent(event)
  }

  public emitTakeEvent(rundown: Rundown): void {
    const event: PartTakenEvent = this.rundownEventBuilder.buildTakeEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitRundownCreated(rundown: Rundown): void {
    const event: RundownCreatedEvent = this.rundownEventBuilder.buildRundownCreatedEvent(rundown)
    this.queueIngestEvent(event)
  }

  public emitRundownUpdated(rundown: Rundown): void {
    const event: RundownUpdatedEvent = this.rundownEventBuilder.buildRundownUpdatedEvent(rundown)
    this.queueIngestEvent(event)
  }

  public emitRundownDeleted(rundownId: string): void {
    const event: RundownDeletedEvent = this.rundownEventBuilder.buildRundownDeletedEvent(rundownId)
    this.queueIngestEvent(event)
  }

  public emitSegmentCreated(rundown: Rundown, segment: Segment): void {
    const event: SegmentCreatedEvent = this.rundownEventBuilder.buildSegmentCreatedEvent(rundown, segment)
    this.queueIngestEvent(event)
  }

  public emitSegmentUpdated(rundown: Rundown, segment: Segment): void {
    const event: SegmentUpdatedEvent = this.rundownEventBuilder.buildSegmentUpdatedEvent(rundown, segment)
    this.queueIngestEvent(event)
  }

  public emitSegmentDeleted(rundown: Rundown, segmentId: string): void {
    const event: SegmentDeletedEvent = this.rundownEventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
    this.queueIngestEvent(event)
  }

  public emitSegmentUnsynced(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): void {
    const event: SegmentUnsyncedEvent = this.rundownEventBuilder.buildSegmentUnsyncedEvent(rundown, unsyncedSegment, originalSegmentId)
    this.queueIngestEvent(event)
  }

  public emitPartCreated(rundown: Rundown, part: Part): void {
    const event: PartCreatedEvent = this.rundownEventBuilder.buildPartCreatedEvent(rundown, part)
    this.queueIngestEvent(event)
  }

  public emitPartUpdated(rundown: Rundown, part: Part): void {
    const event: PartUpdatedEvent = this.rundownEventBuilder.buildPartUpdatedEvent(rundown, part)
    this.queueIngestEvent(event)
  }

  public emitPartDeleted(rundown: Rundown, segmentId: string, partId: string): void {
    const event: PartDeletedEvent = this.rundownEventBuilder.buildPartDeletedEvent(rundown, segmentId, partId)
    this.queueIngestEvent(event)
  }

  public emitPartUnsynced(rundown: Rundown, part: Part): void {
    const event: PartUnsyncedEvent = this.rundownEventBuilder.buildPartUnsyncedEvent(rundown, part)
    this.queueIngestEvent(event)
  }

  public subscribeToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void): void {
    this.callbacks.push(onRundownEventCallback)
  }
}
