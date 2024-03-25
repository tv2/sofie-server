import { Part } from '../../../model/entities/part'
import { Piece } from '../../../model/entities/piece'
import { Owner } from '../../../model/enums/owner'
import { InTransition } from '../../../model/value-objects/in-transition'

export interface RundownService {
  deleteRundown(rundownId: string): Promise<void>
  activateRundown(rundownId: string): Promise<void>
  enterRehearsal(rundownId: string): Promise<void>
  deactivateRundown(rundownId: string): Promise<void>
  takeNext(rundownId: string): Promise<void>
  setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void>
  resetRundown(rundownId: string): Promise<void>
  insertPartAsOnAir(rundownId: string, part: Part): Promise<void>
  insertPartAsNext(rundownId: string, part: Part): Promise<void>
  insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void>
  insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void>
  replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void>
}
