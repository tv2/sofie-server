import { Rundown } from '../../../model/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
} from '../../../model/value-objects/rundown-event'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { Segment } from '../../../model/entities/segment'

export interface RundownEventBuilder {
  buildActivateEvent(rundown: Rundown): RundownActivatedEvent
  buildDeactivateEvent(rundown: Rundown): RundownDeactivatedEvent
  buildResetEvent(rundown: Rundown): RundownResetEvent
  buildTakeEvent(rundown: Rundown): PartTakenEvent
  buildSetNextEvent(rundown: Rundown): PartSetAsNextEvent
  buildDeletedEvent(rundown: Rundown): RundownDeletedEvent
  buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent
  buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent
  buildPieceInsertedEvent(rundown: Rundown, piece: Piece): PieceInsertedEvent
  buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): RundownInfinitePieceAddedEvent

  // TODO: Should we make an IngestEventBuilder? Then our EventBuilder interface will be less bloated.
  buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent
  buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent

  buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent
  buildPartDeletedEvent(rundown: Rundown, partId: string): PartDeletedEvent
}
