import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { Owner } from '../../model/enums/owner'
import { LockRundownException } from '../../model/exceptions/lock-rundown-exception'
import { InTransition } from '../../model/value-objects/in-transition'
import { RundownService } from './interfaces/rundown-service'

const RUNDOWN_LOCK_INTERVAL_MS: number = 500
const RUNDOWN_LOCK_ERROR_TEXT: string = 'Unable to do action. An action was already executed less than 500ms ago'

export class RundownLockService implements RundownService {
  private static instance: RundownService

  public static getInstance(rundownService: RundownService): RundownService {
    if (!this.instance) {
      this.instance = new RundownLockService(rundownService)
    }
    return this.instance
  }

  private lastActionCalledTimestamp: number

  constructor(private readonly rundownService: RundownService) {}

  private assertEnoughTimeHasPassed(): void {
    const now: number = Date.now()
    if (now < this.lastActionCalledTimestamp + RUNDOWN_LOCK_INTERVAL_MS) {
      throw new LockRundownException(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.lastActionCalledTimestamp = now
  }

  public takeNext(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.takeNext(rundownId)
  }

  public activateRundown(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.activateRundown(rundownId)
  }

  public deactivateRundown(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.deactivateRundown(rundownId)
  }

  public resetRundown(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.resetRundown(rundownId)
  }

  public enterRehearsal(rundownId: string): Promise<void> {
    this.assertEnoughTimeHasPassed()
    return this.rundownService.enterRehearsal(rundownId)
  }

  public deleteRundown(rundownId: string): Promise<void> {
    return this.rundownService.deactivateRundown(rundownId)
  }

  public setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    return this.rundownService.setNext(rundownId, segmentId, partId, owner)
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

  public replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    return this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)
  }
}
