import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { Owner } from '../../model/enums/owner'
import { InTransition } from '../../model/value-objects/in-transition'
import { RundownService } from './interfaces/rundown-service'
import { AsyncLock } from '../async-lock'

export class SynchronizedRundownService implements RundownService {

  constructor(private readonly rundownService: RundownService, private readonly rundownLock: AsyncLock) {}

  public takeNext(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.takeNext(rundownId))
  }

  public activateRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.activateRundown(rundownId))
  }

  public deactivateRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.deactivateRundown(rundownId))
  }

  public resetRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.resetRundown(rundownId))
  }

  public enterRehearsal(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.enterRehearsal(rundownId))
  }

  public deleteRundown(rundownId: string): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.deleteRundown(rundownId))
  }

  public setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.setNext(rundownId, segmentId, partId, owner))
  }

  public insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.insertPartAsOnAir(rundownId, part))
  }

  public insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.insertPartAsNext(rundownId, part))
  }

  public insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.insertPieceAsOnAir(rundownId, piece, layersToStopPiecesOn))
  }

  public insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.insertPieceAsNext(rundownId, piece, partInTransition))
  }

  public insertPieceAsNextAndTake(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.insertPieceAsNextAndTake(rundownId, piece, partInTransition))
  }

  public replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    return this.rundownLock.withLock(() => this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece))
  }
}
