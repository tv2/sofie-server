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

export interface IngestEvent<Type extends IngestEventType> extends RundownEvent {
  type: Type
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
  replacedPieceId: string
  newPiece: PieceDto
}

export interface RundownInfinitePiecesUpdatedEvent extends RundownEvent {
  type: RundownEventType.INFINITE_PIECES_UPDATED
  infinitePieces: PieceDto[]
}

export interface BulkIngestEvent extends IngestEvent<IngestEventType.BULK_INGEST_UPDATES> {
  ingestEvents: IngestEvent<IngestEventType>[]
}

export interface RundownCreatedEvent extends IngestEvent<IngestEventType.RUNDOWN_CREATED> {
  rundown: RundownDto
}

export interface RundownUpdatedEvent extends IngestEvent<IngestEventType.RUNDOWN_UPDATED> {
  basicRundown: BasicRundownDto
}

export interface RundownDeletedEvent extends IngestEvent<IngestEventType.RUNDOWN_DELETED> {
}

export interface SegmentCreatedEvent extends IngestEvent<IngestEventType.SEGMENT_CREATED> {
  segment: SegmentDto
}

export interface SegmentUpdatedEvent extends IngestEvent<IngestEventType.SEGMENT_UPDATED> {
  segment: SegmentDto
}

export interface SegmentDeletedEvent extends IngestEvent<IngestEventType.SEGMENT_DELETED> {
  segmentId: string
}

export interface SegmentUnsyncedEvent extends IngestEvent<IngestEventType.SEGMENT_UNSYNCED> {
  unsyncedSegment: SegmentDto
  originalSegmentId: string
}

export interface PartCreatedEvent extends IngestEvent<IngestEventType.PART_CREATED> {
  part: PartDto
}

export interface PartUpdatedEvent extends IngestEvent<IngestEventType.PART_UPDATED> {
  part: PartDto
}

export interface PartDeletedEvent extends IngestEvent<IngestEventType.PART_DELETED> {
  segmentId: string
  partId: string
}

export interface PartUnsyncedEvent extends IngestEvent<IngestEventType.PART_UNSYNCED> {
  part: PartDto
}
