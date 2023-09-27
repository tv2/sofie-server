import { Segment } from './segment'
import { Part } from './part'
import { Exception } from '../exceptions/exception'
import { ErrorCode } from '../enums/error-code'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { NotActivatedException } from '../exceptions/not-activated-exception'
import { AlreadyActivatedException } from '../exceptions/already-activated-exception'
import { Piece } from './piece'
import { BasicRundown } from './basic-rundown'
import { PieceLifespan } from '../enums/piece-lifespan'
import { MisconfigurationException } from '../exceptions/misconfiguration-exception'
import { ExhaustiveCaseChecker } from '../../business-logic/exhaustive-case-checker'
import { TimelineObject } from './timeline-object'
import { LastPartInRundownException } from '../exceptions/last-part-in-rundown-exception'
import { RundownPersistentState } from '../value-objects/rundown-persistent-state'

export interface RundownInterface {
  id: string
  name: string
  segments: Segment[]
  baselineTimelineObjects: TimelineObject[]
  isRundownActive: boolean
  modifiedAt: number
  persistentState?: RundownPersistentState

  alreadyActiveProperties?: {
    activePart: Part
    activeSegment: Segment
    nextPart: Part
    nextSegment: Segment
    infinitePieces: Map<string, Piece>
  }
}

export class Rundown extends BasicRundown {
  private readonly baselineTimelineObjects: TimelineObject[]
  private segments: Segment[]

  private activeSegment: Segment
  private activePart: Part

  private nextSegment: Segment
  private nextPart: Part

  private previousPart?: Part

  private infinitePieces: Map<string, Piece> = new Map()

  private persistentState?: RundownPersistentState

  constructor(rundown: RundownInterface) {
    super(rundown.id, rundown.name, rundown.isRundownActive, rundown.modifiedAt)
    this.segments = rundown.segments ?? []
    this.baselineTimelineObjects = rundown.baselineTimelineObjects ?? []

    if (rundown.alreadyActiveProperties) {
      if (
        !rundown.isRundownActive ||
          !rundown.alreadyActiveProperties.activePart ||
          !rundown.alreadyActiveProperties.nextPart ||
          !rundown.alreadyActiveProperties.activeSegment ||
          !rundown.alreadyActiveProperties.nextSegment
      ) {
        throw new MisconfigurationException(
          'Rundown is missing required values in order to be instantiated as an active Rundown'
        )
      }
      this.activePart = rundown.alreadyActiveProperties.activePart
      this.activeSegment = rundown.alreadyActiveProperties.activeSegment
      this.nextPart = rundown.alreadyActiveProperties.nextPart
      this.nextSegment = rundown.alreadyActiveProperties.nextSegment
      this.infinitePieces = rundown.alreadyActiveProperties.infinitePieces ?? new Map()
    }
  }

  public activate(): void {
    if (this.isActive()) {
      throw new AlreadyActivatedException('Can\'t activate Rundown since it is already activated')
    }
    this.resetSegments()
    this.isRundownActive = true

    this.nextSegment = this.findFirstSegment()
    this.nextPart = this.nextSegment.findFirstPart()

    this.takeNext()
  }

  private resetSegments(): void {
    this.segments.forEach(segment => segment.reset())
  }

  private findFirstSegment(): Segment {
    return this.segments.reduce((previousSegment: Segment, currentSegment: Segment) => {
      return previousSegment.rank < currentSegment.rank ? previousSegment : currentSegment
    })
  }

  private setNextFromActive(): void {
    this.unmarkNextPart()

    try {
      this.nextPart = this.activeSegment.findNextPart(this.activePart)
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_SEGMENT) {
        throw exception
      }
      this.unmarkNextSegment()
      const segment: Segment = this.findNextSegment()
      // TODO: Handle that we might be on the last Segment
      if (segment) {
        this.nextSegment = segment
        this.markNextSegment()
        this.nextPart = this.nextSegment.findFirstPart()
      }
    }

    this.markNextPart()
  }

  private unmarkNextSegment(): void {
    if (this.nextSegment) {
      this.nextSegment.removeAsNext()
    }
  }

  private unmarkNextPart(): void {
    if (this.nextPart) {
      this.nextPart.removeAsNext()
    }
  }

  private markNextSegment(): void {
    if (this.nextSegment) {
      this.nextSegment.setAsNext()
    }
  }

  private markNextPart(): void {
    if (this.nextPart) {
      this.nextPart.setAsNext()
    }
  }

  private findNextSegment(): Segment {
    const activeSegmentIndex: number = this.segments.findIndex((segment) => segment.id === this.activeSegment.id)
    if (activeSegmentIndex === -1) {
      throw new NotFoundException('Segment does not exist in Rundown')
    }
    if (activeSegmentIndex === this.segments.length + 1) {
      throw new LastPartInSegmentException()
    }
    return this.segments[activeSegmentIndex + 1]
  }

  public deactivate(): void {
    this.assertActive(this.deactivate.name)
    this.activeSegment.takeOffAir()
    this.activePart.takeOffAir()
    this.unmarkNextSegment()
    this.unmarkNextPart()
    this.infinitePieces = new Map()
    this.isRundownActive = false
    this.previousPart = undefined
    this.persistentState = undefined
  }

  private assertActive(operationName: string): void {
    if (!this.isRundownActive) {
      throw new NotActivatedException(`Rundown "${this.name}" is not active. Unable to ${operationName}`)
    }
  }

  public getActiveSegment(): Segment {
    this.assertActive(this.getActiveSegment.name)
    return this.activeSegment
  }

  public getNextSegment(): Segment {
    this.assertActive(this.getNextSegment.name)
    return this.nextSegment
  }

  public getActivePart(): Part {
    this.assertActive(this.getActivePart.name)
    return this.activePart
  }

  public getNextPart(): Part {
    this.assertActive(this.getNextPart.name)
    return this.nextPart
  }

  public getPartAfter(part: Part): Part {
    this.assertActive(this.getPartAfter.name)
    const segmentIndexForPart: number = this.getSegmentIndexForPart(part)
    try {
      return  this.segments[segmentIndexForPart].findNextPart(part)
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
      if (segmentIndexForPart + 1 === this.segments.length) {
        throw new LastPartInRundownException()
      }
      return this.segments[segmentIndexForPart + 1].findFirstPart()
    }
  }

  private getSegmentIndexForPart(part: Part): number {
    const segmentIndexForPart: number = this.segments.findIndex((segment) => segment.id === part.getSegmentId())
    if (segmentIndexForPart < 0) {
      throw new NotFoundException(
        `Part: "${part.id}" does not belong to any Segments on Rundown: "${this.id}"`
      )
    }
    return segmentIndexForPart
  }

  public getPreviousPart(): Part | undefined {
    this.assertActive(this.getPreviousPart.name)
    return this.previousPart
  }

  public getBaseline(): TimelineObject[] {
    return this.baselineTimelineObjects
  }

  public takeNext(): void {
    this.assertActive(this.takeNext.name)
    this.setPreviousPart()
    this.takeNextPart()
    this.takeNextSegment()
    this.setNextFromActive()
    this.updateInfinitePieces()
  }

  private setPreviousPart(): void {
    if (!this.activePart?.isOnAir()) {
      // Simple guard to prevent setting PreviousPart on Rundown.activate().
      // Strongly consider refactor into something less implicit.
      return
    }
    this.previousPart = this.activePart.clone()
  }

  private takeNextPart(): void {
    if (this.activePart) {
      this.activePart.takeOffAir()
    }
    this.activePart = this.nextPart
    this.activePart.putOnAir()
    this.activePart.calculateTimings(this.previousPart)
  }

  /**
   * This needs information from the current active Part, so this must be called after the active Part has been updated.
   */
  private takeNextSegment(): void {
    if (this.activeSegment && this.activeSegment.id !== this.nextSegment.id) {
      this.activeSegment.takeOffAir()
    }
    this.activeSegment = this.nextSegment
    this.activeSegment.putOnAir()
  }

  private updateInfinitePieces(): void {
    let layersWithPieces: Map<string, Piece> = new Map(
      this.getActivePart()
        .getPieces()
        .map((piece) => [piece.layer, piece])
    )

    const piecesToCheckIfTheyHaveBeenOutlived: Piece[] = this.findOldInfinitePiecesNotOnLayers(
      new Set(layersWithPieces.keys())
    )
    const piecesThatAreNotOutlived: Piece[] = piecesToCheckIfTheyHaveBeenOutlived.filter(
      (piece) => !this.isPieceOutlived(piece)
    )
    layersWithPieces = this.addPiecesToLayers(piecesThatAreNotOutlived, layersWithPieces)

    layersWithPieces = this.addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces)
    layersWithPieces = this.addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces)

    this.resetOutlivedInfinitePieces(Array.from(layersWithPieces.values()))
    this.setInfinitePieces(layersWithPieces)
  }

  private findOldInfinitePiecesNotOnLayers(layers: Set<string>): Piece[] {
    return Array.from(this.infinitePieces.values()).filter((oldPiece) => !layers.has(oldPiece.layer))
  }

  private isPieceOutlived(piece: Piece): boolean {
    switch (piece.pieceLifespan) {
      case PieceLifespan.WITHIN_PART: {
        // Not an infinite, so we don't care about it and just mark it as outlived.
        return true
      }
      // Once taken, the Piece acts like STICKY_UNTIL_RUNDOWN_CHANGE, so it has same rules about being outlived.
      case PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN:
      case PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE: {
        // Since we are in the context of a Rundown then the Piece will never be able to leave the Rundown, so the Piece is NOT outlived.
        return false
      }
      case PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE: {
        // If the Piece belongs to the active Segment, then the Piece is NOT outlived.
        return !this.activeSegment.doesPieceBelongToSegment(piece)
      }
      case PieceLifespan.SPANNING_UNTIL_RUNDOWN_END:
      case PieceLifespan.SPANNING_UNTIL_SEGMENT_END: {
        // We always mark SPANNING as outlived because even it if isn't we need to check if there is another SPANNING Piece between this Piece and the active Part.
        return true
      }
      default: {
        ExhaustiveCaseChecker.assertAllCases(piece.pieceLifespan)
        return true
      }
    }
  }

  private resetOutlivedInfinitePieces(piecesThatHasNotBeenOutlived: Piece[]): void {
    const pieceIdsThatHasNotBeenOutlived: string[] = piecesThatHasNotBeenOutlived.map((piece) => piece.id)
    Array.from(this.infinitePieces.values())
      .filter((piece) => !pieceIdsThatHasNotBeenOutlived.includes(piece.id))
      .forEach((piece) => piece.resetExecutedAt())
  }

  private addPiecesToLayers(pieces: Piece[], layersWithPieces: Map<string, Piece>): Map<string, Piece> {
    pieces.forEach((piece) => {
      if (layersWithPieces.has(piece.layer)) {
        throw new Error(
          `${piece.pieceLifespan}: Trying to add an infinite Piece to a layer that already have an infinite Piece`
        )
      }
      layersWithPieces.set(piece.layer, piece)
    })
    return layersWithPieces
  }

  private addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces: Map<string, Piece>): Map<string, Piece> {
    const piecesToAdd: Piece[] = this.activeSegment
      .getFirstSpanningPieceForEachLayerBeforePart(this.activePart, new Set(layersWithPieces.keys()))
      .map(this.setExecutedAtIfMissing)
    return this.addPiecesToLayers(piecesToAdd, layersWithPieces)
  }

  private setExecutedAtIfMissing(piece: Piece): Piece {
    if (!piece.getExecutedAt()) {
      piece.setExecutedAt(Date.now())
    }
    return piece
  }

  private addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces: Map<string, Piece>): Map<string, Piece> {
    const indexOfActiveSegment: number = this.segments.findIndex((segment) => segment.id === this.activeSegment.id)
    for (let i = indexOfActiveSegment - 1; i >= 0; i--) {
      const piecesSpanningSegment: Piece[] = this.segments[i]
        .getFirstSpanningRundownPieceForEachLayerForAllParts(new Set(layersWithPieces.keys()))
        .map(this.setExecutedAtIfMissing)
      layersWithPieces = this.addPiecesToLayers(piecesSpanningSegment, layersWithPieces)
    }
    return layersWithPieces
  }

  private setInfinitePieces(layersWithPieces: Map<string, Piece>): void {
    this.infinitePieces = new Map()
    layersWithPieces.forEach((piece: Piece, layer: string) => {
      if (piece.pieceLifespan === PieceLifespan.WITHIN_PART) {
        return
      }
      this.infinitePieces.set(layer, piece)
    })
  }

  public setNext(segmentId: string, partId: string): void {
    this.assertActive(this.setNext.name)
    if (!this.nextSegment || this.nextSegment.id !== segmentId) {
      this.unmarkNextSegment()
      this.nextSegment = this.findSegment(segmentId)
      this.markNextSegment()
    }

    this.unmarkNextPart()
    this.nextPart = this.nextSegment.findPart(partId)
    this.markNextPart()
  }

  private findSegment(segmentId: string): Segment {
    const segment: Segment | undefined = this.segments.find((segment) => segment.id === segmentId)
    if (!segment) {
      throw new NotFoundException(`Segment "${segmentId}" does not exist in Rundown "${this.id}"`)
    }
    return segment
  }

  public setSegments(segments: Segment[]): void {
    this.segments = segments.sort((segmentOne: Segment, segmentTwo: Segment) => segmentOne.rank - segmentTwo.rank)
  }

  public getSegments(): Segment[] {
    return this.segments
  }

  public getInfinitePieces(): Piece[] {
    return Array.from(this.infinitePieces.values())
  }

  public reset(): void {
    this.deactivate()
    this.activate()
  }

  public getPersistentState(): RundownPersistentState {
    return this.persistentState
  }

  public setPersistentState(rundownPersistentState: RundownPersistentState): void {
    this.persistentState = rundownPersistentState
  }

  public insertPartAsNext(part: Part): void {
    this.assertActive(this.insertPartAsNext.name)
    this.activeSegment.insertPartAfterActivePart(part)
    this.setNext(this.activeSegment.id, part.id)
  }

  public insertPieceIntoActivePart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoActivePart.name)
    this.activePart.insertPiece(piece)
    this.updateInfinitePieces()
  }

  public insertPieceIntoNextPart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoNextPart.name)
    this.nextPart.insertPiece(piece)
  }
}
