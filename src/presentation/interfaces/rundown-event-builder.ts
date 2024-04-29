import { Rundown } from '../../model/entities/rundown'
import {
  AutoNextStartedEvent,
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
  RundownInfinitePiecesUpdatedEvent,
  RundownRehearseEvent,
  RundownResetEvent,
  RundownUpdatedEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentUnsyncedEvent,
  SegmentUpdatedEvent,
} from '../value-objects/rundown-event'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { Segment } from '../../model/entities/segment'

export interface RundownEventBuilder {
  buildActivateEvent(rundown: Rundown): RundownActivatedEvent
  buildRehearseEvent(rundown: Rundown): RundownRehearseEvent
  buildDeactivateEvent(rundown: Rundown): RundownDeactivatedEvent
  buildResetEvent(rundown: Rundown): RundownResetEvent
  buildTakeEvent(rundown: Rundown): PartTakenEvent
  buildSetNextEvent(rundown: Rundown): PartSetAsNextEvent
  buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent
  buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent
  buildPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): PieceInsertedEvent
  buildPieceReplacedEvent(rundown: Rundown, segmentId: string, replacedPieceId: string, newPiece: Piece): PieceReplacedEvent
  buildInfinitePiecesUpdatedEvent(rundown: Rundown): RundownInfinitePiecesUpdatedEvent

  buildRundownCreatedEvent(rundown: Rundown): RundownCreatedEvent
  buildRundownUpdatedEvent(rundown: Rundown): RundownUpdatedEvent
  buildRundownDeletedEvent(rundownId: string): RundownDeletedEvent

  buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent
  buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent
  buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent
  buildSegmentUnsyncedEvent(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): SegmentUnsyncedEvent

  buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent
  buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent
  buildPartDeletedEvent(rundown: Rundown, segmentId: string, partId: string): PartDeletedEvent
  buildPartUnsyncedEvent(rundown: Rundown, part: Part): PartUnsyncedEvent

  buildAutoNextStartedEvent(rundownId: string): AutoNextStartedEvent
}
