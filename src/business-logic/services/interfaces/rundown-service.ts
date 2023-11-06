import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Owner } from '../../../model/enums/owner'

export interface RundownService {
  deleteRundown(rundownId: string): Promise<void>
  activateRundown(rundownId: string): Promise<void>
  deactivateRundown(rundownId: string): Promise<void>
  takeNext(rundownId: string): Promise<void>
  setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void>
  resetRundown(rundownId: string): Promise<void>
  insertPartAsOnAir(rundownId: string, part: Part): Promise<void>
  insertPartAsNext(rundownId: string, part: Part): Promise<void>
  insertPieceAsOnAir(rundownId: string, piece: Piece): Promise<void>
  insertPieceAsNext(rundownId: string, piece: Piece): Promise<void>
  replacePieceOnAirOnOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void>
}
