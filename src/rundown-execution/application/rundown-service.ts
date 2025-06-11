import { Part } from '../domain/entities/part'
import { Piece } from '../domain/entities/piece'
import { Owner } from '../domain/enums/owner'
import { InTransition } from '../domain/value-objects/in-transition'
import { SetNextDirection } from '../domain/enums/set-next-direction'
import { TakeMode } from '../domain/enums/take-mode'

export interface RundownService {
  deleteRundown(rundownId: string): Promise<void>
  activateRundown(rundownId: string): Promise<void>
  enterRehearsal(rundownId: string): Promise<void>
  deactivateRundown(rundownId: string): Promise<void>
  setTakeMode(rundownId: string, takeMode: TakeMode): Promise<void>
  takeNext(rundownId: string): Promise<void>
  setNextFromIds(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void>
  setNextFromDirection(rundownId: string, direction: SetNextDirection, owner?: Owner): Promise<void>
  resetRundown(rundownId: string): Promise<void>
  insertPartAsOnAir(rundownId: string, part: Part): Promise<void>
  insertPartAsNext(rundownId: string, part: Part): Promise<void>
  insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void>
  insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void>
  insertPieceAsNextAndTake(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void>
  replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void>
  stopPiece(rundownId: string, pieceId: string): Promise<void>
}
