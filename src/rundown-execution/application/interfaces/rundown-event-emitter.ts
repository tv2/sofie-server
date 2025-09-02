import { Rundown } from '../../domain/entities/rundown'
import { Part } from '../../domain/entities/part'
import { Piece } from '../../domain/entities/piece'
import { Segment } from '../../domain/entities/segment'

export interface RundownEventEmitter {
  emitActivateEvent(rundown: Rundown): void
  emitRehearseEvent(rundown: Rundown): void
  emitDeactivateEvent(rundown: Rundown): void
  emitResetEvent(rundown: Rundown): void
  emitTakeEvent(rundown: Rundown): void
  emitSetNextEvent(rundown: Rundown): void
  emitPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): void
  emitPartInsertedAsNextEvent(rundown: Rundown, part: Part): void
  emitPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): void
  emitPieceReplacedEvent(rundown: Rundown, segmentId: string, replacedPieceId: string, newPiece: Piece): void
  emitPieceStoppedEvent(rundown: Rundown, segmentId: string, piece: Piece): void
  emitInfinitePiecesUpdatedEvent(rundown: Rundown): void

  emitRundownCreated(rundown: Rundown): void
  emitRundownUpdated(rundown: Rundown): void
  emitRundownDeleted(rundownId: string): void

  emitSegmentCreated(rundown: Rundown, segment: Segment): void
  emitSegmentUpdated(rundown: Rundown, segment: Segment): void
  emitSegmentDeleted(rundown: Rundown, segmentId: string): void
  emitSegmentUnsynced(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): void

  emitPartCreated(rundown: Rundown, part: Part): void
  emitPartUpdated(rundown: Rundown, part: Part): void
  emitPartDeleted(rundown: Rundown, segmentId: string, partId: string): void
  emitPartUnsynced(rundown: Rundown, part: Part, originalPartId: string): void
}
