import { EventType, IngestEventType, RundownEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { PartDto } from '../dtos/part-dto'
import { PieceDto } from '../dtos/piece-dto'
import { SegmentDto } from '../dtos/segment-dto'
import { BasicRundownDto } from '../dtos/basic-rundown-dto'
import { RundownDto } from '../dtos/rundown-dto'

export interface RundownEvent extends TypedEvent {
  type: EventType
  rundownId: string
}

export interface PartEvent extends RundownEvent {
  segmentId: string
  partId: string
}

export interface RundownActivatedEvent extends RundownEvent {
  type: RundownEventType.ACTIVATED
}

export interface RundownRehearseEvent extends RundownEvent {
  type: RundownEventType.REHEARSE
}

export interface RundownDeactivatedEvent extends RundownEvent {
  type: RundownEventType.DEACTIVATED
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

export interface PartInsertedAsOnAirEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_ON_AIR
  part: PartDto
}

export interface PartInsertedAsNextEvent extends RundownEvent {
  type: RundownEventType.PART_INSERTED_AS_NEXT
  part: PartDto
}

export interface PieceInsertedEvent extends PartEvent {
  type: RundownEventType.PIECE_INSERTED
  piece: PieceDto
}

export interface PieceReplacedEvent extends PartEvent {
  type: RundownEventType.PIECE_REPLACED
  replacedPiece: PieceDto
  newPiece: PieceDto
}

export interface RundownInfinitePiecesUpdatedEvent extends RundownEvent {
  type: RundownEventType.INFINITE_PIECES_UPDATED
  infinitePieces: PieceDto[]
}

export interface AutoNextStartedEvent extends RundownEvent {
  type: RundownEventType.AUTO_NEXT_STARTED
}

export interface RundownCreatedEvent extends RundownEvent {
  type: IngestEventType.RUNDOWN_CREATED
  rundown: RundownDto
}

export interface RundownUpdatedEvent extends RundownEvent {
  type: IngestEventType.RUNDOWN_UPDATED
  basicRundown: BasicRundownDto
}

export interface RundownDeletedEvent extends RundownEvent {
  type: IngestEventType.RUNDOWN_DELETED
}

export interface SegmentCreatedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_CREATED
  segment: SegmentDto
}

export interface SegmentUpdatedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_UPDATED
  segment: SegmentDto
}

export interface SegmentDeletedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_DELETED
  segmentId: string
}

export interface SegmentUnsyncedEvent extends RundownEvent {
  type: IngestEventType.SEGMENT_UNSYNCED
  unsyncedSegment: SegmentDto
  originalSegmentId: string
}

export interface PartCreatedEvent extends RundownEvent {
  type: IngestEventType.PART_CREATED
  part: PartDto
}

export interface PartUpdatedEvent extends RundownEvent {
  type: IngestEventType.PART_UPDATED
  part: PartDto
}

export interface PartDeletedEvent extends RundownEvent {
  type: IngestEventType.PART_DELETED
  segmentId: string
  partId: string
}

export interface PartUnsyncedEvent extends RundownEvent {
  type: IngestEventType.PART_UNSYNCED
  part: PartDto
}
