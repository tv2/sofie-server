import { PieceType } from '../enums/piece-type'
import { TimelineObject } from './timeline-object'
import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'
import { UnsupportedOperation } from '../exceptions/unsupported-operation'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'

export interface PieceInterface {
  id: string
  partId: string
  name: string
  layer: string
  type: PieceType
  pieceLifespan: PieceLifespan
  isPlanned: boolean
  start: number
  duration?: number
  preRollDuration: number
  postRollDuration: number
  executedAt?: number
  transitionType: TransitionType
  timelineObjects: TimelineObject[]

  metadata?: unknown
  content?: unknown
  tags: string[]
  isUnsynced: boolean
}

export class Piece {
  public readonly id: string
  public name: string
  public layer: string
  public type: PieceType
  public pieceLifespan: PieceLifespan
  public isPlanned: boolean = true
  public duration?: number
  public preRollDuration: number
  public postRollDuration: number
  public transitionType: TransitionType
  public timelineObjects: TimelineObject[]

  public readonly metadata?: unknown
  public content?: unknown
  public tags: string[]

  private partId: string
  private start: number
  private executedAt: number
  private isUnsyncedPiece: boolean = false

  constructor(piece: PieceInterface) {
    this.id = piece.id
    this.partId = piece.partId
    this.name = piece.name
    this.layer = piece.layer
    this.type = piece.type
    this.pieceLifespan = piece.pieceLifespan
    this.isPlanned = piece.isPlanned
    this.start = piece.start
    this.duration = piece.duration
    this.preRollDuration = piece.preRollDuration
    this.postRollDuration = piece.postRollDuration
    this.transitionType = piece.transitionType
    this.timelineObjects = piece.timelineObjects

    this.metadata = piece.metadata
    this.content = piece.content
    this.tags = piece.tags
    this.isUnsyncedPiece = piece.isUnsynced

    this.setExecutedAt(piece.executedAt ?? 0)
  }

  public setExecutedAt(executedAt: number): void {
    if (this.pieceLifespan === PieceLifespan.WITHIN_PART) {
      // Only care about executedAt for infinite Pieces
      // since Pieces within Part always needs to be "executed" when the Part is taken.
      return
    }
    this.executedAt = executedAt
  }

  public resetExecutedAt(): void {
    this.executedAt = 0
  }

  public getExecutedAt(): number {
    return this.executedAt
  }

  public markAsUnsyncedWithUnsyncedPart(): void {
    if (!this.partId.endsWith(UNSYNCED_ID_POSTFIX)) {
      this.partId = `${this.partId}${UNSYNCED_ID_POSTFIX}`
    }
    this.markAsUnsynced()
  }

  public markAsUnsynced(): void {
    this.isUnsyncedPiece = true
  }

  public isUnsynced(): boolean {
    return this.isUnsyncedPiece
  }

  public getPartId(): string {
    return this.partId
  }

  public setPartId(partId: string): void {
    if (this.isPlanned) {
      throw new UnsupportedOperation(`Can't update PartId for Piece: ${this.id}. Only unplanned Pieces are allowed to have their Part id updated!`)
    }
    this.partId = partId
  }

  public setStart(startTimestamp: number): void {
    if (this.isPlanned) {
      throw new UnsupportedOperation(`Trying to set the start of a planned Piece ${this.id}. Only unplanned Pieces are allowed to have their start updated!`)
    }
    this.start = startTimestamp
  }

  public getStart(): number {
    return this.start
  }

  public getUnsyncedCopy(): Piece {
    const unsyncedId: string = this.id.endsWith(UNSYNCED_ID_POSTFIX) ? this.id : `${this.id}${UNSYNCED_ID_POSTFIX}`
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: unsyncedId})
  }
}
