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

// TODO: Find a better way to type Parts and Piece for Inserted events.
export interface PartInsertedAsOnAirEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_ON_AIR,
  part: {
    id: string,
    segmentId: string
    name: string,
    isPlanned: false,
    expectedDuration: number
    isPartNext: false,
    isPartOnAir: true,
    executedAt: number
    playedDuration: number
    autoNext?: AutoNext
    pieces: {
      id: string,
      partId: string,
      isPlanned: false,
      name: string,
      start: number
      duration: number,
      layer: string,
      type: string
    }[]
  }
}

export interface PartInsertedAsNextEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_NEXT,
  part: {
    id: string,
    segmentId: string
    name: string,
    isPlanned: false,
    expectedDuration: number
    isPartNext: true,
    isPartOnAir: false,
    executedAt: number
    playedDuration: number
    autoNext?: AutoNext
    pieces: {
      id: string,
      partId: string,
      isPlanned: false,
      name: string,
      start: number
      duration: number,
      layer: string,
      type: string
    }[]
  }
}

export interface PieceInsertedEvent extends RundownEvent {
  type: RundownEventType.PIECE_INSERTED,
  piece: {
    id: string,
    partId: string,
    isPlanned: false,
    name: string,
    start: number
    duration: number,
    layer: string,
    type: string
  }
}

export interface RundownInfinitePieceAddedEvent extends RundownEvent {
  type: RundownEventType.INFINITE_PIECE_ADDED,
  infinitePiece: {
    id: string
    name: string
    layer: string
  }
}

export interface SegmentCreatedEvent extends SegmentEvent {
  type: IngestEventType.SEGMENT_CREATED
}

export interface SegmentUpdatedEvent extends SegmentEvent {
  type: IngestEventType.SEGMENT_UPDATED
}

export interface SegmentDeletedEvent extends SegmentEvent {
  type : IngestEventType.SEGMENT_DELETED
}

export interface PartCreatedEvent extends PartEvent {
  type: IngestEventType.PART_CREATED
}

export interface PartUpdatedEvent extends PartEvent {
  type: IngestEventType.PART_UPDATED
}

export interface PartDeletedEvent extends PartEvent {
  type: IngestEventType.PART_DELETED
}
