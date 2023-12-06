import { Piece } from './piece'
import { PieceLifespan } from '../enums/piece-lifespan'
import { PartTimings } from '../value-objects/part-timings'
import { UnsupportedOperation } from '../exceptions/unsupported-operation'
import { InTransition } from '../value-objects/in-transition'
import { OutTransition } from '../value-objects/out-transition'
import { AutoNext } from '../value-objects/auto-next'
import { PartEndState } from '../value-objects/part-end-state'
import { IngestedPart } from './ingested-part'
import { IngestedPiece } from './ingested-piece'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'

export interface PartInterface {
  id: string
  rundownId: string
  segmentId: string
  name: string
  rank: number
  isPlanned: boolean
  pieces: Piece[]
  isOnAir: boolean
  isNext: boolean
  isUntimed: boolean
  isUnsynced: boolean
  expectedDuration?: number
  executedAt?: number
  playedDuration?: number

  inTransition: InTransition
  outTransition: OutTransition

  autoNext?: AutoNext
  disableNextInTransition: boolean

  timings?: PartTimings
  endState?: PartEndState

  defaultPart?: IngestedPart
}

export class Part {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly isPlanned: boolean = true

  public readonly expectedDuration?: number

  public readonly outTransition: OutTransition

  public readonly autoNext?: AutoNext
  public readonly disableNextInTransition: boolean

  private segmentId: string
  private rank: number

  private pieces: Piece[]
  private replacedPlannedPieces: Piece[]

  private isPartOnAir: boolean
  private isPartNext: boolean

  private readonly isPartUntimed: boolean = false
  private isPartUnsynced: boolean = false

  private executedAt: number
  private playedDuration: number
  private timings?: PartTimings

  private inTransition: InTransition

  /*
   * The EndState of the Part
   * This should be set when the Part becomes the Previous Part.
   */
  private endState?: PartEndState

  public readonly defaultPart?: IngestedPart

  constructor(part: PartInterface) {
    if (part.isPlanned && !part.defaultPart) {
      throw new UnsupportedOperation(`Found planned Part ${part.id} without a default Part. Planned Parts must have default Parts!`)
    }

    this.id = part.id
    this.rundownId = part.rundownId
    this.segmentId = part.segmentId
    this.name = part.name
    this.rank = part.rank
    this.isPlanned = part.isPlanned
    this.pieces = part.pieces ?? []
    this.replacedPlannedPieces = []
    this.isPartOnAir = part.isOnAir
    this.isPartNext = part.isNext
    this.expectedDuration = part.expectedDuration

    this.inTransition = part.inTransition ?? { keepPreviousPartAliveDuration: 0, delayPiecesDuration: 0 }
    this.outTransition = part.outTransition ?? { keepAliveDuration: 0 }

    this.disableNextInTransition = part.disableNextInTransition
    this.autoNext = part.autoNext

    this.executedAt = part.executedAt ?? 0
    this.playedDuration = part.playedDuration ?? 0

    this.endState = part.endState

    this.timings = part.timings
    this.isPartUntimed = part.isUntimed
    this.isPartUnsynced = part.isUnsynced

    this.defaultPart = part.defaultPart
  }

  public putOnAir(): void {
    this.isPartOnAir = true

    const now: number = Date.now()
    this.executedAt = now
    this.playedDuration = 0
    this.pieces.forEach((piece) => piece.setExecutedAt(now))
  }

  public takeOffAir(): void {
    this.isPartOnAir = false
    this.playedDuration = Date.now() - this.executedAt
  }

  public markAsUnsyncedWithUnsyncedSegment(): void {
    if (!this.segmentId.endsWith(UNSYNCED_ID_POSTFIX)) {
      this.segmentId = `${this.segmentId}${UNSYNCED_ID_POSTFIX}`
    }
    this.markAsUnsynced()
  }

  public markAsUnsynced(): Part {
    this.isPartUnsynced = true
    this.rank = this.rank - 1
    this.pieces.forEach(piece => piece.markAsUnsyncedWithUnsyncedPart())
    this.pieces = this.pieces.map(piece => piece.getUnsyncedCopy())
    return this
  }

  public isUntimed(): boolean {
    return this.isPartUntimed
  }

  public isUnsynced(): boolean {
    return this.isPartUnsynced
  }

  public isOnAir(): boolean {
    return this.isPartOnAir
  }

  public setAsNext(): void {
    this.isPartNext = true
  }

  public removeAsNext(): void {
    this.isPartNext = false
  }

  public isNext(): boolean {
    return this.isPartNext
  }

  public getPieces(): Piece[] {
    return this.pieces
  }

  public setPieces(pieces: Piece[]): void {
    this.pieces = pieces
  }

  public insertPiece(unPlannedPiece: Piece): void {
    if (unPlannedPiece.isPlanned) {
      throw new UnsupportedOperation(`Trying to insert a planned Piece ${unPlannedPiece.id} to Part ${this.id}.`)
    }
    unPlannedPiece.setPartId(this.id)
    if (this.isPartOnAir) {
      const timeSincePutOnAir: number = Date.now() - this.executedAt
      unPlannedPiece.setStart(timeSincePutOnAir)
    }
    const indexOfExistingPieceOnLayer: number = this.pieces.findIndex(piece => piece.layer === unPlannedPiece.layer)
    if (indexOfExistingPieceOnLayer >= 0) {
      const piecesToBeRemoved: Piece[] = this.pieces.splice(indexOfExistingPieceOnLayer, 1)
      piecesToBeRemoved.forEach(piece => {
        if (piece.isPlanned) {
          this.replacedPlannedPieces.push(piece)
        }
      })
    }
    this.pieces.push(unPlannedPiece)
  }

  public replacePiece(pieceToBeReplaced: Piece, newPiece: Piece): void {
    const pieceIndex: number = this.pieces.findIndex(piece => piece.id === pieceToBeReplaced.id)
    if (pieceIndex < 0) {
      throw new UnsupportedOperation(`Can't replace Piece on Part ${this.id}. Piece ${pieceToBeReplaced.id} does not exist on Part.`)
    }

    if (pieceToBeReplaced.isPlanned) {
      this.replacedPlannedPieces.push(pieceToBeReplaced)
    }

    newPiece.setPartId(this.id)
    this.pieces[pieceIndex] = newPiece
  }

  public getPiecesWithLifespan(lifespanFilters: PieceLifespan[]): Piece[] {
    return this.pieces.filter((piece) => lifespanFilters.includes(piece.pieceLifespan))
  }

  public getExecutedAt(): number {
    return this.executedAt
  }

  public getPlayedDuration(): number {
    return this.playedDuration
  }

  public getSegmentId(): string {
    return this.segmentId
  }

  public getRank(): number {
    return this.rank
  }

  public setSegmentId(segmentId: string): void {
    if (this.isPlanned) {
      throw new UnsupportedOperation(`Can't update SegmentId for Part: ${this.id}. Only unplanned Parts are allowed to have their Segment id updated!`)
    }
    this.segmentId = segmentId
  }

  // TODO: This implementation currently reflects how Core implemented it. It's in dire need of a refactor.
  public calculateTimings(previousPart?: Part): void {
    const maxPreRollDurationFromPieces: number = this.pieces
    // Note: Core filters for !BlueprintPieceType.Normal and piece.enable.start !== 'now' - Will Pieces ever have a PreRollDuration?
      .reduce((preRollDuration: number, piece: Piece) => Math.max(preRollDuration, piece.preRollDuration ?? 0), 0)

    const maxPostRollDurationForPieces: number = this.pieces
      .filter((piece) => !!piece.postRollDuration && !piece.duration)
      .reduce((postRollDuration: number, piece: Piece) => Math.max(postRollDuration, piece.postRollDuration), 0)
    let inTransition: InTransition | undefined
    let allowTransition: boolean = false

    if (previousPart /* && notInHold */) {
      if (previousPart.autoNext && previousPart.autoNext.overlap) {
        // Having "autoNext" & "autoNextOverLap" overrides the InTransition of the next Part.
        allowTransition = false
        inTransition = {
          keepPreviousPartAliveDuration: previousPart.autoNext.overlap,
          delayPiecesDuration: 0,
        }
      } else if (!previousPart.disableNextInTransition) {
        allowTransition = true
        inTransition = {
          keepPreviousPartAliveDuration: this.inTransition.keepPreviousPartAliveDuration ?? 0,
          delayPiecesDuration: this.inTransition.delayPiecesDuration ?? 0,
        }
      }
    }

    if (!inTransition || !previousPart) {
      const delayStartOfPiecesDuration: number = Math.max(
        0,
        previousPart?.outTransition.keepAliveDuration ?? 0,
        maxPreRollDurationFromPieces
      )

      this.timings = {
        inTransitionStart: undefined,
        delayStartOfPiecesDuration,
        postRollDuration: maxPostRollDurationForPieces,
        previousPartContinueIntoPartDuration:
            delayStartOfPiecesDuration + (previousPart?.getTimings().postRollDuration ?? 0),
      }
      return
    }

    const previousPartOutTransitionDuration: number = previousPart.outTransition.keepAliveDuration
      ? previousPart.outTransition.keepAliveDuration - inTransition.keepPreviousPartAliveDuration
      : 0

    const preRollDurationConsideringDelay: number = maxPreRollDurationFromPieces - inTransition.delayPiecesDuration
    const delayStartOfPiecesDuration: number = Math.max(
      0,
      previousPartOutTransitionDuration,
      preRollDurationConsideringDelay
    )

    this.timings = {
      inTransitionStart: allowTransition ? delayStartOfPiecesDuration : undefined,
      delayStartOfPiecesDuration: delayStartOfPiecesDuration + inTransition.delayPiecesDuration,
      postRollDuration: maxPostRollDurationForPieces,
      previousPartContinueIntoPartDuration:
          delayStartOfPiecesDuration +
          inTransition.keepPreviousPartAliveDuration +
          previousPart.getTimings().postRollDuration,
    }
  }

  public getTimings(): PartTimings {
    if (!this.timings) {
      throw new UnsupportedOperation(`No Timings has been calculated for Part: ${this.id}`)
    }
    return this.timings
  }

  public getEndState(): PartEndState | undefined {
    return this.endState
  }

  public setEndState(endState: PartEndState): void {
    this.endState = endState
  }

  public getInTransition(): InTransition {
    return this.inTransition
  }

  public reset(): void {
    if (!this.defaultPart) {
      return
    }

    this.executedAt = 0
    this.playedDuration = 0
    this.inTransition = this.defaultPart.inTransition
    this.timings = this.defaultPart.timings
    this.endState = undefined

    this.pieces = [
      ...this.pieces.filter(piece => piece.isPlanned),
      ...this.replacedPlannedPieces
    ].filter(piece => this.defaultPart!.ingestedPieces.some(ingestPiece => ingestPiece.id === piece.id))
      .map(piece => {
        const ingestedPiece: IngestedPiece = this.defaultPart!.ingestedPieces.find(ingestPiece => ingestPiece.id === piece.id)!
        piece.resetFromIngestedPiece(ingestedPiece)
        return piece
      })
    this.replacedPlannedPieces = []
  }

  public clone(): Part {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  public getUnsyncedCopy(): Part {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: `${this.id}${UNSYNCED_ID_POSTFIX}`})
  }

  public updateInTransition(inTransition: InTransition): void {
    this.inTransition = {
      keepPreviousPartAliveDuration: Math.max(inTransition.keepPreviousPartAliveDuration, this.inTransition.keepPreviousPartAliveDuration),
      delayPiecesDuration: Math.max(inTransition.delayPiecesDuration, this.inTransition.delayPiecesDuration)
    }
  }
}
