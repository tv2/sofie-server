import { Rundown } from '../../../model/entities/rundown'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Segment } from '../../../model/entities/segment'

export interface RundownEventEmitter {
  emitActivateEvent(rundown: Rundown): void
  emitDeactivateEvent(rundown: Rundown): void
  emitResetEvent(rundown: Rundown): void
  emitTakeEvent(rundown: Rundown): void
  emitSetNextEvent(rundown: Rundown): void
  emitPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): void
  emitPartInsertedAsNextEvent(rundown: Rundown, part: Part): void
  emitPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): void
  emitInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): void

  emitRundownCreated(rundown: Rundown): void
  emitRundownUpdated(rundown: Rundown): void
  emitRundownDeleted(rundownId: string): void

  emitSegmentCreated(rundown: Rundown, segment: Segment): void
  emitSegmentUpdated(rundown: Rundown, segment: Segment): void
  emitSegmentDeleted(rundown: Rundown, segmentId: string): void

  emitPartCreated(rundown: Rundown, part: Part): void
  emitPartUpdated(rundown: Rundown, part: Part): void
  emitPartDeleted(rundown: Rundown, partId: string): void
}
