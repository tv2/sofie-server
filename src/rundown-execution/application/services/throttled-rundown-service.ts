import { Part } from '../../domain/entities/part'
import { Piece } from '../../domain/entities/piece'
import { Owner } from '../../domain/enums/owner'
import { ThrottledRundownException } from '../../domain/exceptions/throttled-rundown-exception'
import { InTransition } from '../../domain/value-objects/in-transition'
import { RundownService } from '../interfaces/rundown-service'
import { SetNextDirection } from '../../domain/enums/set-next-direction'
import { TakeMode } from '../../domain/enums/take-mode'

const RUNDOWN_THROTTLED_INTERVAL_MS: number = 500
const RUNDOWN_THROTTLED_ERROR_TEXT: string = `Unable to do action. An action was already executed less than ${RUNDOWN_THROTTLED_INTERVAL_MS}ms ago`

export class ThrottledRundownService implements RundownService {

  private lastOperationTakenEpochTimestamp: number

  constructor(private readonly rundownService: RundownService) {
  }

  public setTakeMode(rundownId: string, takeMode: TakeMode): Promise<void> {
    return this.rundownService.setTakeMode(rundownId, takeMode)
  }

  private assertEnoughTimeHasPassed(): void {
    const now: number = Date.now()
    if (now < this.lastOperationTakenEpochTimestamp + RUNDOWN_THROTTLED_INTERVAL_MS) {
      throw new ThrottledRundownException(RUNDOWN_THROTTLED_ERROR_TEXT)
    }
    this.lastOperationTakenEpochTimestamp = now
  }

  public takeNext(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.takeNext(rundownId)
  }

  public activateRundown(rundownId: string): Promise<void> {
    return this.rundownService.activateRundown(rundownId)
  }

  public deactivateRundown(rundownId: string): Promise<void> {
    return this.rundownService.deactivateRundown(rundownId)
  }

  public resetRundown(rundownId: string): Promise<void> {
    return this.rundownService.resetRundown(rundownId)
  }

  public enterRehearsal(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.enterRehearsal(rundownId)
  }

  public deleteRundown(rundownId: string): Promise<void> {
    return this.rundownService.deleteRundown(rundownId)
  }

  public setNextFromIds(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    return this.rundownService.setNextFromIds(rundownId, segmentId, partId, owner)
  }

  public setNextFromDirection(rundownId: string, direction: SetNextDirection, owner?: Owner): Promise<void> {
    return this.rundownService.setNextFromDirection(rundownId, direction, owner)
  }

  public insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    return this.rundownService.insertPartAsOnAir(rundownId, part)
  }

  public insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    return this.rundownService.insertPartAsNext(rundownId, part)
  }

  public insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void> {
    return this.rundownService.insertPieceAsOnAir(rundownId, piece, layersToStopPiecesOn)
  }

  public insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownService.insertPieceAsNext(rundownId, piece, partInTransition)
  }

  public insertPieceAsNextAndTake(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    return this.rundownService.insertPieceAsNextAndTake(rundownId, piece, partInTransition)
  }

  public replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    return this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)
  }

  public stopPiece(rundownId: string, pieceId: string): Promise<void> {
    return this.rundownService.stopPiece(rundownId, pieceId)
  }
}
