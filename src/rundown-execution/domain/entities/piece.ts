import { TimelineObject } from './timeline-object'
import { PieceLifespan } from '../enums/piece-lifespan'
import { TransitionType } from '../enums/transition-type'
import { UnsupportedOperationException } from '../../../cross-cutting-concerns/domain/exceptions/unsupported-operation-exception'
import { IngestedPiece } from './ingested-piece'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'
import { PieceMetadata } from '../value-objects/metadata'
import { DuplicateIdException } from '../exceptions/duplicate-id-exception'

export interface PieceInterface {
  id: string
  partId: string
  rundownId: string
  name: string
  layer: string
  pieceLifespan: PieceLifespan
  isPlanned: boolean
  start: number
  duration?: number
  preRollDuration: number
  postRollDuration: number
  executedAt?: number
  takenOffAirTimestamp: number
  transitionType: TransitionType
  timelineObjects: TimelineObject[]

  metadata: PieceMetadata
  content?: unknown
  tags: string[]
  isUnsynced: boolean
  isInsertedOnAir?: boolean
  createdFromActionId?: string
}

export class Piece {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly layer: string
  public readonly pieceLifespan: PieceLifespan
  public readonly isPlanned: boolean = true
  public readonly createdFromActionId?: string
  public readonly preRollDuration: number
  public readonly postRollDuration: number
  public readonly transitionType: TransitionType

  public readonly metadata: PieceMetadata
  public readonly content?: unknown
  public readonly tags: string[]

  private partId: string
  private start: number
  private expectedDuration?: number
  private executedAt: number
  private takenOffAirTimestamp: number
  private isUnsyncedPiece: boolean = false
  private isPieceInsertedOnAir: boolean
  private originalTimelineObjects: TimelineObject[]
  private readonly insertedTimelineObjects: TimelineObject[] = []

  public constructor(piece: PieceInterface) {
    this.id = piece.id
    this.partId = piece.partId
    this.rundownId = piece.rundownId
    this.name = piece.name
    this.layer = piece.layer
    this.pieceLifespan = piece.pieceLifespan
    this.isPlanned = piece.isPlanned
    this.createdFromActionId = piece.createdFromActionId
    this.start = piece.start
    this.expectedDuration = piece.duration
    this.executedAt = piece.executedAt ?? 0
    this.takenOffAirTimestamp = piece.takenOffAirTimestamp
    this.preRollDuration = piece.preRollDuration
    this.postRollDuration = piece.postRollDuration
    this.transitionType = piece.transitionType

    this.metadata = piece.metadata
    this.content = piece.content
    this.tags = piece.tags
    this.isUnsyncedPiece = piece.isUnsynced
    this.isPieceInsertedOnAir = piece.isInsertedOnAir ?? false
    this.originalTimelineObjects = piece.timelineObjects ? [...piece.timelineObjects] : []
  }

  public resetFromIngestedPiece(ingestedPiece: IngestedPiece): void {
    this.start = ingestedPiece.start
    this.expectedDuration = ingestedPiece.duration
    if (this.pieceLifespan === PieceLifespan.WITHIN_PART) {
      // Infinite Pieces might still be OnAir when their Part is reset, so we can't reset their "executedAt" here.
      this.resetExecution()
    }
    this.originalTimelineObjects = [...ingestedPiece.timelineObjects]
  }

  public putOnAir(putOnAirTimestamp: number): void {
    if (this.executedAt) {
      return
    }
    this.executedAt = putOnAirTimestamp
  }

  public takeOffAir(takenOffAirTimestamp: number): void {
    if (this.executedAt === 0) {
      return
    }
    const pieceDuration: number = this.expectedDuration || Infinity
    const expectedTakenOffAirTimestamp: number = this.takenOffAirTimestamp ? this.takenOffAirTimestamp : this.executedAt + pieceDuration
    if (expectedTakenOffAirTimestamp < takenOffAirTimestamp) {
      return
    }
    this.takenOffAirTimestamp = takenOffAirTimestamp
  }

  public resetExecution(): void {
    this.executedAt = 0
    this.takenOffAirTimestamp = 0
  }

  public getExecutedAt(): number {
    return this.executedAt
  }

  public getTakenOffAirTimestamp(): number {
    return this.takenOffAirTimestamp
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

  public getDuration(): number | undefined {
    if (this.executedAt > 0 && this.takenOffAirTimestamp > 0) {
      return this.takenOffAirTimestamp - this.executedAt
    }
    return this.expectedDuration
  }

  public getExpectedDuration(): number {
    return this.expectedDuration ?? 0
  }

  public isInsertedOnAir(): boolean {
    return this.isPieceInsertedOnAir
  }

  public markAsInsertedOnAir(): void {
    this.isPieceInsertedOnAir = true
  }

  public getUnsyncedCopy(): Piece {
    const unsyncedId: string = this.id.endsWith(UNSYNCED_ID_POSTFIX) ? this.id : `${this.id}${UNSYNCED_ID_POSTFIX}`
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: unsyncedId })
  }

  public copy(newPartId?: string): Piece {
    const id: string = `${this.id}_COPY`
    const partId: string = newPartId ?? this.partId
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: id, partId, isPlanned: false, insertedTimelineObjects: [] })
  }

  public getTimelineObjects(): TimelineObject[] {
    return [...this.originalTimelineObjects, ...this.insertedTimelineObjects]
  }

  public insertTimelineObjects(timelineObjects: TimelineObject[]): void {
    timelineObjects.forEach((timelineObjectToBeInserted) => {
      const containsDuplicateId: boolean = this.getTimelineObjects().some(timelineObject => timelineObject.id === timelineObjectToBeInserted.id)
      if (containsDuplicateId) {
        throw new DuplicateIdException(`A TimelineObject with id '${timelineObjectToBeInserted.id}' already exist on Piece ${this.id}`)
      }
    })
    this.insertedTimelineObjects.push(...timelineObjects)
  }

  public hasEnded(timestamp: number): boolean {
    if (!this.executedAt) {
      return false
    }
    const pieceDuration: number = this.expectedDuration || Infinity
    const expectedTakenOffAirTimestamp: number = this.takenOffAirTimestamp ? this.takenOffAirTimestamp : this.executedAt + pieceDuration
    return expectedTakenOffAirTimestamp <= timestamp
  }
}
