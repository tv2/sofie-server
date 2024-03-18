import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { Owner } from '../../model/enums/owner'
import { InTransition } from '../../model/value-objects/in-transition'
import { RundownService } from './interfaces/rundown-service'

const RUNDOWN_LOCK_INTERVAL = 500
const RUNDOWN_LOCK_ERROR_TEXT = 'Unable to do action. An action was already executed less than 500ms ago'

export class RundownLockService implements RundownService {
  private static instance: RundownService
  private hasEnoughTimePassed: boolean = true

  constructor(private readonly rundownService: RundownService) {}

  public static getInstance(rundownService: RundownService): RundownService {
    if (!this.instance) {
      this.instance = new RundownLockService(rundownService)
    }
    return this.instance
  }

  public takeNext(rundownId: string): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.takeNext(rundownId)
  }

  public deleteRundown(rundownId: string): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.deactivateRundown(rundownId)
  }

  public activateRundown(rundownId: string): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.activateRundown(rundownId)
  }

  public enterRehearsal(rundownId: string): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.enterRehearsal(rundownId)
  }

  public deactivateRundown(rundownId: string): Promise<void> {
    return this.rundownService.deactivateRundown(rundownId)
  }

  public setNext(rundownId: string, segmentId: string, partId: string, owner?: Owner): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.setNext(rundownId, segmentId, partId, owner)
  }

  public resetRundown(rundownId: string): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.resetRundown(rundownId)
  }

  public insertPartAsOnAir(rundownId: string, part: Part): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.insertPartAsOnAir(rundownId, part)
  }

  public insertPartAsNext(rundownId: string, part: Part): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.insertPartAsNext(rundownId, part)
  }

  public insertPieceAsOnAir(rundownId: string, piece: Piece, layersToStopPiecesOn?: string[]): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.insertPieceAsOnAir(rundownId, piece, layersToStopPiecesOn)
  }

  public insertPieceAsNext(rundownId: string, piece: Piece, partInTransition?: InTransition): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.insertPieceAsNext(rundownId, piece, partInTransition)
  }

  public replacePieceOnAirOnNextPart(rundownId: string, pieceToBeReplaced: Piece, newPiece: Piece): Promise<void> {
    if (!this.hasEnoughTimePassed) {
      throw new Error(RUNDOWN_LOCK_ERROR_TEXT)
    }
    this.hasEnoughTimePassed = false
    setTimeout(() => (this.hasEnoughTimePassed = true), RUNDOWN_LOCK_INTERVAL)
    return this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)
  }
}
