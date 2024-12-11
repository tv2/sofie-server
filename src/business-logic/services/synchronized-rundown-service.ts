import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { Owner } from '../../model/enums/owner'
import { InTransition } from '../../model/value-objects/in-transition'
import { RundownService } from './interfaces/rundown-service'
import { AsyncLock } from '../async-lock'
import { SetNextDirection } from '../../model/enums/set-next-direction'

export class SynchronizedRundownService implements RundownService {

  constructor(private readonly rundownService: RundownService, private readonly rundownLock: AsyncLock) {
  }

  public takeNext(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.takeNext.name, () => this.rundownService.takeNext(rundownId))
  }

  public activateRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.activateRundown.name, () => this.rundownService.activateRundown(rundownId))
  }

  public deactivateRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.deactivateRundown.name, () => this.rundownService.deactivateRundown(rundownId))
  }

  public resetRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.resetRundown.name, () => this.rundownService.resetRundown(rundownId))
  }

  public enterRehearsal(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.enterRehearsal.name, () => this.rundownService.enterRehearsal(rundownId))
  }

  public deleteRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(this.deleteRundown.name, () => this.rundownService.deleteRundown(rundownId))
  }

  public setNextFromIds(rundownId: string, segmentId: string, partId: string, owner?: Owner | undefined): Promise<void> {
    return this.rundownLock.withLock(this.setNextFromIds.name, () => this.rundownService.setNextFromIds(rundownId, segmentId, partId, owner))
  }

  public setNextFromDirection(rundownId: string, direction: SetNextDirection, owner?: Owner | undefined): Promise<void> {
    return this.rundownLock.withLock(this.setNextFromDirection.name, () => this.rundownService.setNextFromDirection(rundownId, direction, owner))
  }

  public insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    return this.rundownLock.withLock(this.insertPartAsOnAir.name, () => this.rundownService.insertPartAsOnAir(rundownId, part))
  }

  public insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    return this.rundownLock.withLock(this.insertPartAsNext.name, () => this.rundownService.insertPartAsNext(rundownId, part))
  }

  public insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void> {
    return this.rundownLock.withLock(this.insertPieceAsOnAir.name, () => this.rundownService.insertPieceAsOnAir(rundownId, piece, layersToStopPiecesOn))
  }

  public insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownLock.withLock(this.insertPieceAsNext.name, () => this.rundownService.insertPieceAsNext(rundownId, piece, partInTransition))
  }

  public insertPieceAsNextAndTake(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownLock.withLock(this.insertPieceAsNextAndTake.name, () => this.rundownService.insertPieceAsNextAndTake(rundownId, piece, partInTransition))
  }

  public replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    return this.rundownLock.withLock(this.replacePieceOnAirOnNextPart.name, () => this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece))
  }

  public stopPiece(rundownId: string, pieceId: string): Promise<void> {
    return this.rundownLock.withLock(this.stopPiece.name, () => this.rundownService.stopPiece(rundownId, pieceId))
  }
}
