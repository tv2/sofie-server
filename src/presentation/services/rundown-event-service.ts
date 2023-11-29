import { RundownEventListener } from '../interfaces/rundown-event-listener'
import {
  PartCreatedEvent, PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent, PartUpdatedEvent,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownCreatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
  RundownUpdatedEvent,
  SegmentCreatedEvent, SegmentDeletedEvent,
  SegmentUpdatedEvent
} from '../value-objects/rundown-event'
import { RundownEventEmitter } from '../../business-logic/services/interfaces/rundown-event-emitter'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { EventBuilderFacade } from '../facades/event-builder-facade'
import { Rundown } from '../../model/entities/rundown'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { Segment } from '../../model/entities/segment'

export class RundownEventService implements RundownEventEmitter, RundownEventListener {
  private static instance: RundownEventService

  public static getInstance(): RundownEventService {
    if (!this.instance) {
      this.instance = new RundownEventService(EventBuilderFacade.createRundownEventBuilder())
    }
    return this.instance
  }

  private readonly callbacks: ((rundownEvent: RundownEvent) => void)[] = []

  private constructor(private readonly rundownEventBuilder: RundownEventBuilder) {
    return
  }

  private emitRundownEvent(rundownEvent: RundownEvent): void {
    this.callbacks.forEach((cb) => cb(rundownEvent))
  }

  public emitActivateEvent(rundown: Rundown): void {
    const event: RundownActivatedEvent = this.rundownEventBuilder.buildActivateEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitDeactivateEvent(rundown: Rundown): void {
    const event: RundownDeactivatedEvent = this.rundownEventBuilder.buildDeactivateEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitInfinitePiecesUpdatedEvent(rundown: Rundown): void {
    const event: RundownInfinitePieceAddedEvent = this.rundownEventBuilder.buildInfinitePiecesUpdatedEvent(rundown)
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

  public emitResetEvent(rundown: Rundown): void {
    const event: RundownResetEvent = this.rundownEventBuilder.buildResetEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitSetNextEvent(rundown: Rundown): void {
    const event: PartSetAsNextEvent = this.rundownEventBuilder.buildSetNextEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitTakeEvent(rundown: Rundown): void {
    const event: PartTakenEvent = this.rundownEventBuilder.buildTakeEvent(rundown)
    this.emitRundownEvent(event)
  }

  public emitRundownCreated(rundown: Rundown): void {
    const event: RundownCreatedEvent = this.rundownEventBuilder.buildRundownCreatedEvent(rundown)
    this.emitRundownEvent(event)
  }
  public emitRundownUpdated(rundown: Rundown): void {
    const event: RundownUpdatedEvent = this.rundownEventBuilder.buildRundownUpdatedEvent(rundown)
    this.emitRundownEvent(event)
  }
  public emitRundownDeleted(rundownId: string): void {
    const event: RundownDeletedEvent = this.rundownEventBuilder.buildRundownDeletedEvent(rundownId)
    this.emitRundownEvent(event)
  }
  public emitSegmentCreated(rundown: Rundown, segment: Segment): void {
    const event: SegmentCreatedEvent = this.rundownEventBuilder.buildSegmentCreatedEvent(rundown, segment)
    this.emitRundownEvent(event)
  }
  public emitSegmentUpdated(rundown: Rundown, segment: Segment): void {
    const event: SegmentUpdatedEvent = this.rundownEventBuilder.buildSegmentUpdatedEvent(rundown, segment)
    this.emitRundownEvent(event)
  }
  public emitSegmentDeleted(rundown: Rundown, segmentId: string): void {
    const event: SegmentDeletedEvent = this.rundownEventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
    this.emitRundownEvent(event)
  }
  public emitPartCreated(rundown: Rundown, part: Part): void {
    const event: PartCreatedEvent = this.rundownEventBuilder.buildPartCreatedEvent(rundown, part)
    this.emitRundownEvent(event)
  }
  public emitPartUpdated(rundown: Rundown, part: Part): void {
    const event: PartUpdatedEvent = this.rundownEventBuilder.buildPartUpdatedEvent(rundown, part)
    this.emitRundownEvent(event)
  }
  public emitPartDeleted(rundown: Rundown, partId: string): void {
    const event: PartDeletedEvent = this.rundownEventBuilder.buildPartDeletedEvent(rundown, partId)
    this.emitRundownEvent(event)
  }

  public listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void): void {
    this.callbacks.push(onRundownEventCallback)
  }
}
