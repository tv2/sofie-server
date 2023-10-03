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
import { UnsupportedOperation } from '../exceptions/unsupported-operation'
import { RundownCursor } from '../value-objects/rundown-cursor'
import { Owner } from '../enums/owner'

export interface RundownInterface {
  id: string
  name: string
  showStyleVariantId: string
  segments: Segment[]
  baselineTimelineObjects: TimelineObject[]
  isRundownActive: boolean
  modifiedAt: number
  persistentState?: RundownPersistentState

  alreadyActiveProperties?: RundownAlreadyActiveProperties
}

export interface RundownAlreadyActiveProperties {
  activeCursor: RundownCursor | undefined
  nextCursor: RundownCursor | undefined
  infinitePieces: Map<string, Piece>
}


export class Rundown extends BasicRundown {
  private readonly baselineTimelineObjects: TimelineObject[]
  private readonly segments: Segment[]

  private activeCursor?: RundownCursor
  private nextCursor?: RundownCursor

  private previousPart?: Part

  private infinitePieces: Map<string, Piece> = new Map()

  private persistentState?: RundownPersistentState

  private readonly showStyleVariantId: string

  constructor(rundown: RundownInterface) {
    super(rundown.id, rundown.name, rundown.isRundownActive, rundown.modifiedAt)
    this.segments = rundown.segments ?? []
    this.baselineTimelineObjects = rundown.baselineTimelineObjects ?? []
    this.showStyleVariantId = rundown.showStyleVariantId

    if (rundown.alreadyActiveProperties) {
      if (!rundown.isRundownActive) {
        throw new MisconfigurationException('Trying to instantiate an inactive Rundown as active')
      }
      this.activeCursor = rundown.alreadyActiveProperties.activeCursor
      this.nextCursor = rundown.alreadyActiveProperties.nextCursor
      this.infinitePieces = rundown.alreadyActiveProperties.infinitePieces ?? new Map()
    }
  }

  public activate(): void {
    if (this.isActive()) {
      throw new AlreadyActivatedException('Can\'t activate Rundown since it is already activated')
    }
    this.resetSegments()
    this.isRundownActive = true

    const firstSegment: Segment = this.findFirstSegment()
    this.nextCursor = {
      part: firstSegment.findFirstPart(),
      segment: firstSegment,
      owner: Owner.SYSTEM
    }
  }

  private createCursor(cursor: RundownCursor | undefined, cursorPatch: Partial<RundownCursor> = {}): RundownCursor | undefined {
    if (!cursor) {
      return
    }
    return {...cursor, ...cursorPatch}
  }

  private resetSegments(): void {
    this.segments.forEach(segment => segment.reset())
  }

  private findFirstSegment(): Segment {
    return this.segments.reduce((previousSegment: Segment, currentSegment: Segment) => {
      return previousSegment.rank < currentSegment.rank ? previousSegment : currentSegment
    })
  }

  private setNextFromActive(owner: Owner): void {
    this.unmarkNextPart()

    if (!this.activeCursor) {
      return
    }

    try {
      const nextPart: Part = this.activeCursor.segment.findNextPart(this.activeCursor.part)
      this.nextCursor = this.createCursor(this.nextCursor, { part: nextPart, owner })
    } catch (exception) {
      if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_SEGMENT) {
        throw exception
      }
      this.unmarkNextSegment()
      const segment: Segment = this.findNextSegment()
      // TODO: Handle that we might be on the last Segment
      if (segment) {
        this.nextCursor = this.createCursor(this.nextCursor, { segment, part: segment.findFirstPart(), owner })
        this.markNextSegment()
      }
    }

    this.markNextPart()
  }

  private unmarkNextSegment(): void {
    if (!this.nextCursor) {
      return
    }
    this.nextCursor.segment.removeAsNext()
  }

  private unmarkNextPart(): void {
    if (!this.nextCursor) {
      return
    }
    this.nextCursor.part.removeAsNext()
  }

  private markNextSegment(): void {
    if (!this.nextCursor) {
      return
    }
    this.nextCursor.segment.setAsNext()
  }

  private markNextPart(): void {
    if (!this.nextCursor) {
      return
    }
    this.nextCursor.part.setAsNext()
  }

  private findNextSegment(): Segment {
    const activeSegmentIndex: number = this.segments.findIndex((segment) => segment.id === this.activeCursor?.segment?.id)
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
    this.deactivateActivePartAndSegment()
    this.unmarkNextSegment()
    this.unmarkNextPart()
    this.nextCursor = undefined
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

  private deactivateActivePartAndSegment(): void {
    if (!this.activeCursor) {
      return
    }
    this.activeCursor.part.takeOffAir()
    this.activeCursor.segment.takeOffAir()
    this.activeCursor = undefined
  }

  public getActiveSegment(): Segment {
    this.assertActive(this.getActiveSegment.name)
    this.assertNotUndefined(this.activeCursor, 'active Cursor')
    return this.activeCursor.segment
  }

  private assertNotUndefined<T>(value: T, nameOfType: string): asserts value is NonNullable<T> {
    if (!value) {
      throw new UnsupportedOperation(`Trying to fetch ${nameOfType} of Rundown before ${nameOfType} has been set`)
    }
  }

  public getNextSegment(): Segment {
    this.assertActive(this.getNextSegment.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    return this.nextCursor.segment
  }

  public isActivePartSet(): boolean {
    return !!this.activeCursor
  }

  public getActivePart(): Part {
    this.assertActive(this.getActivePart.name)
    this.assertNotUndefined(this.activeCursor, 'active Cursor')
    return this.activeCursor.part
  }

  public getNextPart(): Part {
    this.assertActive(this.getNextPart.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    return this.nextCursor.part
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

  public getShowStyleVariantId(): string {
    return this.showStyleVariantId
  }

  public takeNext(): void {
    this.assertActive(this.takeNext.name)
    this.setPreviousPart()
    this.takeNextCursor()
    this.setNextFromActive(Owner.SYSTEM)
    this.updateInfinitePieces()

    // TODO: If we changed Segments and if the Segment we came from is removed by ingest, we should remove it from the Rundown
  }

  private setPreviousPart(): void {
    if (!this.activeCursor?.part.isOnAir()) {
      // Simple guard to prevent setting PreviousPart on Rundown.activate().
      // Strongly consider refactor into something less implicit.
      return
    }
    this.previousPart = this.activeCursor?.part.clone()
  }

  private takeNextCursor(): void {
    if (this.activeCursor) {
      this.activeCursor.part.takeOffAir()
      this.activeCursor.segment.takeOffAir()
      this.activeCursor.segment.takeOffAir()
    }
    if (!this.nextCursor) {
      return
    }
    this.activeCursor = this.nextCursor
    this.activeCursor.part.putOnAir()
    this.activeCursor.part.calculateTimings(this.previousPart)
    this.activeCursor.segment.putOnAir()
  }

  private updateInfinitePieces(): void {
    this.assertNotUndefined(this.activeCursor, 'active Part')

    let layersWithPieces: Map<string, Piece> = new Map(
      this.activeCursor.part
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
        this.assertNotUndefined(this.activeCursor, 'active Cursor')
        // If the Piece belongs to the active Segment, then the Piece is NOT outlived.
        return !this.activeCursor.segment.doesPieceBelongToSegment(piece)
      }
      case PieceLifespan.SPANNING_UNTIL_RUNDOWN_END:
      case PieceLifespan.SPANNING_UNTIL_SEGMENT_END: {
        // We always mark SPANNING as outlived because even it if isn't we need to check if there is another SPANNING Piece between this Piece and the active Part.
        return true
      }
      default: {
        ExhaustiveCaseChecker.assertAllCases(piece.pieceLifespan)
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
    this.assertNotUndefined(this.activeCursor, 'active Cursor')

    const piecesToAdd: Piece[] = this.activeCursor.segment
      .getFirstSpanningPieceForEachLayerBeforePart(this.activeCursor.part, new Set(layersWithPieces.keys()))
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
    const indexOfActiveSegment: number = this.segments.findIndex((segment) => segment.id === this.activeCursor?.segment?.id)
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

  public setNext(segmentId: string, partId: string, owner?: Owner): void {
    this.assertActive(this.setNext.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')

    let nextSegment: Segment = this.nextCursor.segment
    if (this.nextCursor.segment.id !== segmentId) {
      this.unmarkNextSegment()
      nextSegment = this.findSegment(segmentId)
    }
    this.unmarkNextPart()

    this.nextCursor = this.createCursor(this.nextCursor, { segment: nextSegment, part: nextSegment.findPart(partId), owner: owner ?? Owner.SYSTEM })

    this.markNextSegment()
    this.markNextPart()
  }

  private findSegment(segmentId: string): Segment {
    const segment: Segment | undefined = this.segments.find((segment) => segment.id === segmentId)
    if (!segment) {
      throw new NotFoundException(`Segment "${segmentId}" does not exist in Rundown "${this.id}"`)
    }
    return segment
  }

  private compareSegments(segmentOne: Segment, segmentTwo: Segment): number {
    return segmentOne.rank - segmentTwo.rank
  }

  public addSegment(segment: Segment): void {
    this.segments.push(segment)
    this.segments.sort(this.compareSegments)
  }

  public removeSegment(segmentId: string): void {
    const segmentIndex: number = this.segments.findIndex(s => s.id === segmentId)
    if (segmentIndex < 0) {
      return
    }
    // TODO: Account for the Segment being on Air
    this.segments.splice(segmentIndex, 1)
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
    this.assertNotUndefined(this.activeCursor, 'active Segment')

    this.activeCursor.segment.insertPartAfterActivePart(part)
    this.setNext(this.activeCursor.segment.id, part.id)
  }

  public insertPieceIntoActivePart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoActivePart.name)
    this.assertNotUndefined(this.activeCursor, 'active Part')

    this.activeCursor.part.insertPiece(piece)
    this.updateInfinitePieces()
  }

  public insertPieceIntoNextPart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoNextPart.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    this.nextCursor.part.insertPiece(piece)
  }

  public getActiveCursor(): RundownCursor | undefined {
    return this.activeCursor
  }

  public getNextCursor(): RundownCursor | undefined {
    return this.nextCursor
  }
}
