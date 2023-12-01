import { TimelineObject } from './timeline-object'
import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'
import { UnsupportedOperationException } from '../exceptions/unsupported-operation-exception'
import { IngestedPiece } from './ingested-piece'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'

export interface PieceInterface {
  id: string
  partId: string
  name: string
  layer: string
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
  public readonly name: string
  public readonly layer: string
  public readonly pieceLifespan: PieceLifespan
  public readonly isPlanned: boolean = true
  public readonly duration?: number
  public readonly preRollDuration: number
  public readonly postRollDuration: number
  public readonly transitionType: TransitionType
  public readonly timelineObjects: TimelineObject[]

  public readonly metadata?: unknown
  public readonly content?: unknown
  public readonly tags: string[]

  private partId: string
  private start: number
  private executedAt: number
  private isUnsyncedPiece: boolean = false

  constructor(piece: PieceInterface) {
    this.id = piece.id
    this.partId = piece.partId
    this.name = piece.name
    this.layer = piece.layer
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

  public resetFromIngestedPiece(ingestedPiece: IngestedPiece): void {
    this.start = ingestedPiece.start
    if (this.pieceLifespan === PieceLifespan.WITHIN_PART) {
      // Infinite Pieces might still be OnAir when their Part is reset, so we can't reset their "executedAt" here.
      this.executedAt = 0
    }
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
      throw new UnsupportedOperationException(`Can't update PartId for Piece: ${this.id}. Only unplanned Pieces are allowed to have their Part id updated!`)
    }
    this.partId = partId
  }

  public setStart(startTimestamp: number): void {
    if (this.isPlanned) {
      throw new UnsupportedOperationException(`Trying to set the start of a planned Piece ${this.id}. Only unplanned Pieces are allowed to have their start updated!`)
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
