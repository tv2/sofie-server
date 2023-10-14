import { Rundown } from '../../../model/entities/rundown'
import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'

export interface RundownEventEmitter {
  emitActivateEvent(rundown: Rundown): void
  emitDeactivateEvent(rundown: Rundown): void
  emitResetEvent(rundown: Rundown): void
  emitTakeEvent(rundown: Rundown): void
  emitSetNextEvent(rundown: Rundown): void
  emitDeletedEvent(rundown: Rundown): void
  emitPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): void
  emitPartInsertedAsNextEvent(rundown: Rundown, part: Part): void
  emitPieceInsertedEvent(rundown: Rundown, piece: Piece): void
  emitInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): void
}
