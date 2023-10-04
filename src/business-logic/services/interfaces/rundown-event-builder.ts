import { Rundown } from '../../../model/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUpdatedEvent,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentUpdatedEvent,
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

  buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent
  buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent
  buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent

  buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent
  buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent
  buildPartDeletedEvent(rundown: Rundown, partId: string): PartDeletedEvent
}
