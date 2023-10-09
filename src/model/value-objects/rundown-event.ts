import { EventType, IngestEventType, RundownEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { AutoNext } from './auto-next'

export interface RundownEvent extends TypedEvent {
  type: EventType
  rundownId: string
}

export interface SegmentEvent extends RundownEvent {
  segmentId: string
}

export interface PartEvent extends SegmentEvent {
  partId: string
}

export interface RundownActivatedEvent extends RundownEvent {
  type: RundownEventType.ACTIVATED
}

export interface RundownDeactivatedEvent extends RundownEvent {
  type: RundownEventType.DEACTIVATED
}

export interface RundownDeletedEvent extends RundownEvent {
  type: RundownEventType.DELETED
}

export interface RundownResetEvent extends RundownEvent {
  type: RundownEventType.RESET
}

export interface PartTakenEvent extends PartEvent {
  type: RundownEventType.TAKEN
}

export interface PartSetAsNextEvent extends PartEvent {
  type: RundownEventType.SET_NEXT
}

// TODO: Find a better way to type Segments, Parts and Piece for Inserted events.
export interface SegmentEventInterface {
  id: string
  rundownId: string
  name: string
  rank: number
  isOnAir: boolean
  isNext: boolean
  budgetDuration?: number
  parts: PartEventInterface[]
}

export interface PartEventInterface {
  id: string
  segmentId: string
  name: string
  isPlanned: false
  expectedDuration: number
  isPartNext: boolean
  isPartOnAir: boolean
  executedAt: number
  playedDuration: number
  autoNext?: AutoNext
  pieces: PieceEventInterface[]
}

export interface PieceEventInterface {
  id: string
  partId: string
  isPlanned: false
  name: string
  start: number
  duration?: number
  layer: string
  type: string
}

export interface PartInsertedAsOnAirEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_ON_AIR,
  part: PartEventInterface
}

export interface PartInsertedAsNextEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_NEXT,
  part: PartEventInterface
}

export interface PieceInsertedEvent extends RundownEvent {
  type: RundownEventType.PIECE_INSERTED,
  piece: PieceEventInterface
}

export interface RundownInfinitePieceAddedEvent extends RundownEvent {
  type: RundownEventType.INFINITE_PIECE_ADDED,
  infinitePiece: {
    id: string
    name: string
    layer: string
  }
}

export interface SegmentCreatedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_CREATED
  segment: SegmentEventInterface
}

export interface SegmentUpdatedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_UPDATED
  segment: SegmentEventInterface
}

export interface SegmentDeletedEvent extends RundownEvent {
  type : IngestEventType.SEGMENT_DELETED
  segmentId: string
}

export interface PartCreatedEvent extends RundownEvent {
  type: IngestEventType.PART_CREATED
  part: PartEventInterface
}

export interface PartUpdatedEvent extends RundownEvent {
  type: IngestEventType.PART_UPDATED
  part: PartEventInterface
}

export interface PartDeletedEvent extends RundownEvent {
  type: IngestEventType.PART_DELETED
  partId: string
}
