import { Segment } from './segment'
import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { NotActivatedException } from '../exceptions/not-activated-exception'
import { AlreadyActivatedException } from '../exceptions/already-activated-exception'
import { Piece } from './piece'
import { BasicRundown } from './basic-rundown'
import { PieceLifespan } from '../enums/piece-lifespan'
import { MisconfigurationException } from '../../../cross-cutting-concerns/domain/exceptions/misconfiguration-exception'
import { ExhaustiveCaseChecker } from '../../../cross-cutting-concerns/domain/services/exhaustive-case-checker'
import { TimelineObject } from './timeline-object'
import { LastPartInRundownException } from '../exceptions/last-part-in-rundown-exception'
import { RundownPersistentState } from '../value-objects/rundown-persistent-state'
import {
  UnsupportedOperationException
} from '../../../cross-cutting-concerns/domain/exceptions/unsupported-operation-exception'
import { RundownCursor } from '../value-objects/rundown-cursor'
import { Owner } from '../enums/owner'
import { AlreadyExistException } from '../exceptions/already-exist-exception'
import { LastSegmentInRundownException } from '../exceptions/last-segment-in-rundown-exception'
import { NoPartInHistoryException } from '../exceptions/no-part-in-history-exception'
import { OnAirException } from '../exceptions/on-air-exception'
import { RundownTiming } from '../value-objects/rundown-timing'
import { InTransition } from '../value-objects/in-transition'
import { RundownMode } from '../enums/rundown-mode'
import { AlreadyRehearsalException } from '../exceptions/already-rehearsal-exception'
import { InvalidSegmentException } from '../exceptions/invalid-segment-exception'
import { InvalidPartException } from '../exceptions/invalid-part-exception'
import { SetNextDirection } from '../enums/set-next-direction'
import { FirstPartInSegmentException } from '../exceptions/first-part-in-segment-exception'
import { FirstSegmentInRundownException } from '../exceptions/first-segment-in-rundown-exception'
import { TakeMode } from '../enums/take-mode'
import { PartTimings } from '../value-objects/part-timings'

export interface RundownInterface {
  id: string
  name: string
  showStyleVariantId: string
  segments: Segment[]
  baselineTimelineObjects: TimelineObject[]
  baselinePieces: Piece[]
  mode: RundownMode
  takeMode: TakeMode
  modifiedAt: number
  persistentState?: RundownPersistentState
  history: Part[]
  timing: RundownTiming

  alreadyActiveProperties?: RundownAlreadyActiveProperties
}

export interface RundownAlreadyActiveProperties {
  activeCursor: RundownCursor | undefined
  nextCursor: RundownCursor | undefined
  infinitePieces: Map<string, Piece[]>
}

const MAXIMUM_HISTORY_ENTRIES: number = 30

export class Rundown extends BasicRundown {
  private readonly baselineTimelineObjects: TimelineObject[]
  private baselinePieces: Piece[]
  private segments: Segment[]

  private activeCursor?: RundownCursor
  private nextCursor?: RundownCursor

  private previousPart?: Part

  private infinitePieces: Map<string, Piece[]> = new Map()

  private persistentState?: RundownPersistentState

  private readonly showStyleVariantId: string

  private history: Part[]

  public constructor(rundown: RundownInterface) {
    super(rundown.id, rundown.name, rundown.mode, rundown.takeMode, rundown.modifiedAt, rundown.timing)
    this.segments = rundown.segments ? [...rundown.segments].sort(this.compareSegments) : []
    this.baselineTimelineObjects = rundown.baselineTimelineObjects ?? []
    this.baselinePieces = rundown.baselinePieces ?? []
    this.showStyleVariantId = rundown.showStyleVariantId
    this.history = rundown.history ?? []
    this.persistentState = rundown.persistentState

    if (rundown.alreadyActiveProperties) {
      if (rundown.mode === RundownMode.INACTIVE) {
        throw new MisconfigurationException('Trying to instantiate an inactive Rundown as active')
      }
      this.activeCursor = rundown.alreadyActiveProperties.activeCursor
      this.nextCursor = rundown.alreadyActiveProperties.nextCursor
      this.infinitePieces = rundown.alreadyActiveProperties.infinitePieces ?? new Map()

      this.markNextPart()
    }
  }

  public activate(): void {
    if (this.isActive()) {
      throw new AlreadyActivatedException('Can\'t activate Rundown since it is already activated.')
    }
    if (this.mode === RundownMode.REHEARSAL) {
      this.mode = RundownMode.ACTIVE
      return
    }
    this.initializeRundown(RundownMode.ACTIVE)
  }

  public enterRehearsal(): void {
    if (this.isActive()) {
      throw new AlreadyActivatedException('Can\'t set Rundown to rehearsal since it is already activated.')
    }
    if (this.getMode() === RundownMode.REHEARSAL) {
      throw new AlreadyRehearsalException('Can\'t set Rundown to rehearsal since it is already in rehearsal.')
    }
    this.initializeRundown(RundownMode.REHEARSAL)
  }

  private initializeRundown(mode: RundownMode): void {
    this.mode = mode
    this.setFirstSegmentAndPartNextCursor()
  }

  private setFirstSegmentAndPartNextCursor(): void {
    if (!this.doesValidSegmentExistInRundown()) {
      return
    }
    const firstSegment: Segment = this.findFirstSegment()
    firstSegment.setAsNext()
    const firstPart: Part = firstSegment.findFirstPartNotOnAir()
    firstPart.setAsNext()
    this.nextCursor = {
      part: firstPart,
      segment: firstSegment,
      owner: Owner.SYSTEM
    }
  }

  private doesValidSegmentExistInRundown(): boolean {
    return this.segments.some(segment => segment.isValid())
  }

  private resetHistory(): void {
    this.history = []
  }

  private createCursor(cursor: RundownCursor | undefined, cursorPatch: Partial<RundownCursor> = {}): RundownCursor | undefined {
    if (!cursor) {
      return
    }
    return { ...cursor, ...cursorPatch }
  }

  private removeUnsyncedSegments(): void {
    this.segments = this.segments.filter(segment => !segment.isUnsynced())
  }

  private resetSegments(): void {
    this.segments.forEach(segment => segment.reset())
  }

  private findFirstSegment(): Segment {
    const segment: Segment | undefined = this.segments.find(segment => segment.isValid())
    if (!segment) {
      throw new NotFoundException(`Unable to find first valid Segment for Rundown ${this.id}`)
    }
    return segment
  }

  private setNextFromActive(owner: Owner): void {
    this.unmarkNextPart()
    if (!this.activeCursor) {
      try {
        this.unmarkNextSegment()
        if (this.getSegments().length === 0) {
          this.nextCursor = undefined
        }
        this.setFirstSegmentAndPartNextCursor()
      } catch (exception) {
        if (!(exception instanceof NotFoundException)) {
          throw exception
        }
      }
      return
    }

    this.unmarkNextSegment()
    try {
      const nextPart: Part = this.activeCursor.segment.findNextPartNotOnAir(this.activeCursor.part)
      const nextSegment: Segment | undefined = this.segments.find(segment => segment.id === nextPart.getSegmentId())
      this.nextCursor = this.createCursor(this.nextCursor, { segment: nextSegment, part: nextPart, owner })
      this.markNextSegment()
      this.markNextPart()
      return
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
    }

    try {
      const segment: Segment = this.findNextValidSegment()
      this.nextCursor = this.createCursor(this.nextCursor, { segment, part: segment.findFirstPartNotOnAir(), owner })
      this.markNextSegment()
    } catch (error) {
      if (!(error instanceof LastSegmentInRundownException)) {
        throw error
      }
      this.nextCursor = this.createCursor(this.activeCursor)
      this.markNextSegment()
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

    if (this.nextCursor.part.invalidity) {
      this.setNextFromActive(Owner.SYSTEM)
    }

    this.nextCursor.part.setAsNext()
  }

  private findNextValidSegment(): Segment {
    const activeSegmentIndex: number = this.segments.findIndex(segment => segment.id === this.activeCursor?.segment?.id)
    if (activeSegmentIndex === -1) {
      throw new NotFoundException('Active Segment does not exist in Rundown')
    }

    const nextValidSegment: Segment | undefined = this.segments.slice(activeSegmentIndex + 1).find(segment => segment.isValid())
    if (!nextValidSegment) {
      throw new LastSegmentInRundownException(`Segment: ${this.activeCursor?.segment?.id} is the last valid Segment of Rundown: ${this.id}`)
    }

    return nextValidSegment
  }

  public deactivate(): void {
    this.assertActive(this.deactivate.name)
    this.mode = RundownMode.INACTIVE
    this.reset()
    this.clearNextCursor()
  }

  public setTakeMode(takeMode: TakeMode): void {
    this.takeMode = takeMode
  }

  private assertActive(operationName: string): void {
    if (this.mode === RundownMode.INACTIVE) {
      throw new NotActivatedException(`Rundown "${this.name}" is not active. Unable to ${operationName}`)
    }
  }

  private clearActiveCursor(): void {
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
      throw new UnsupportedOperationException(`Trying to fetch ${nameOfType} of Rundown before ${nameOfType} has been set`)
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
      return this.segments[segmentIndexForPart].findNextPartNotOnAir(part)
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
      if (segmentIndexForPart + 1 === this.segments.length) {
        throw new LastPartInRundownException(`Part: ${part.id} is the last Part of Rundown: ${this.id}.`)
      }
      return this.findFirstPartOfValidSegmentSkippingUnsyncedSegments(segmentIndexForPart + 1)
    }
  }

  private getSegmentIndexForPart(part: Part): number {
    const segmentIndexForPart: number = this.segments.findIndex(segment => segment.id === part.getSegmentId())
    if (segmentIndexForPart < 0) {
      throw new NotFoundException(
        `Part: "${part.id}" does not belong to any Segments on Rundown: "${this.id}"`
      )
    }
    return segmentIndexForPart
  }

  private findFirstPartOfValidSegmentSkippingUnsyncedSegments(indexToSearchFrom: number): Part {
    while (indexToSearchFrom < this.segments.length) {
      if (!this.segments[indexToSearchFrom].isUnsynced() && this.segments[indexToSearchFrom].isValid()) {
        return this.segments[indexToSearchFrom].findFirstPart()
      }
      indexToSearchFrom++
    }
    throw new LastPartInRundownException(`No more Parts in the Rundown: ${this.id}`)
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
  }

  private setPreviousPart(): void {
    if (!this.activeCursor?.part.isOnAir()) {
      // Simple guard to prevent setting PreviousPart on Rundown.activate().
      // Strongly consider refactor into something less implicit.
      return
    }
    this.previousPart = this.activeCursor?.part.clone()
    this.addPartToHistory(this.previousPart)
  }

  private addPartToHistory(part: Part): void {
    this.history.push(part)
    if (this.history.length > MAXIMUM_HISTORY_ENTRIES) {
      this.history = this.history.slice(-MAXIMUM_HISTORY_ENTRIES)
    }
  }

  private takeNextCursor(): void {
    if (this.activeCursor) {
      this.activeCursor.part.takeOffAir()
      this.activeCursor.segment.takeOffAir()
      this.activeCursor.segment.removeUnsyncedParts()
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

    const now: number = Date.now()
    let layersWithPieces: Map<string, Piece[]> = new Map(
      this.getActivePart().getPieces()
        .filter(piece => !piece.hasEnded(now))
        .map(piece => [piece.layer, [piece]])
    )

    const piecesThatAreNotOutlived: Piece[] = this.findNotOutlivedInfinitePieces()
    layersWithPieces = this.addPiecesToLayers(piecesThatAreNotOutlived, layersWithPieces)

    layersWithPieces = this.addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces)
    layersWithPieces = this.addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces)

    this.addBaselinePiecesNotOnLayers(layersWithPieces)
    this.resetInfinitePiecesNoLongerPresent(layersWithPieces)
    this.setInfinitePieces(layersWithPieces)
  }

  private findNotOutlivedInfinitePieces(): Piece[] {
    return Array.from(this.infinitePieces.values()).flat().filter(piece => !this.isPieceOutlived(piece))
  }

  private isPieceOutlived(piece: Piece): boolean {
    if (piece.hasEnded(Date.now())) {
      return true
    }
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
        // We always mark SPANNING as outlived because even if it isn't we need to check if there is another SPANNING Piece between this Piece and the active Part.
        return true
      }
      default: {
        ExhaustiveCaseChecker.assertAllCases(piece.pieceLifespan, 'piece lifespan')
      }
    }
  }

  private resetInfinitePiecesNoLongerPresent(newInfinitePieces: Map<string, Piece[]>): void {
    this.infinitePieces.forEach((infinitePiecesOnLayer: Piece[], layer: string) => {
      const newInfinitePiecesOnLayer: Piece[] = newInfinitePieces.get(layer) ?? []
      infinitePiecesOnLayer
        .filter(pieceOnLayer => newInfinitePiecesOnLayer.every(newPieceOnLayer => newPieceOnLayer.id !== pieceOnLayer.id))
        .forEach(pieceNoLongerPresent => pieceNoLongerPresent.resetExecution())
    })
  }

  private addPiecesToLayers(pieces: Piece[], layersWithPieces: Map<string, Piece[]>): Map<string, Piece[]> {
    pieces.forEach((piece) => {
      const piecesOnLayer: Piece[] | undefined = layersWithPieces.get(piece.layer) ?? []
      if (piecesOnLayer.length === 0) {
        layersWithPieces.set(piece.layer, [piece])
        return
      }

      const activePartTimings: PartTimings = this.getActivePart().getTimings()

      if (activePartTimings.delayStartOfPiecesDuration === 0) {
        return
      }

      const newestPieceOnLayer: Piece = piecesOnLayer[0] // Checks the id against the newest piece on the layer. TODO: Move PieceLayer Logic out into a domain object.
      if (piece.id === newestPieceOnLayer.id) {
        return
      }
      piece.takeOffAir(newestPieceOnLayer.getExecutedAt() + activePartTimings.delayStartOfPiecesDuration)
      layersWithPieces.set(piece.layer, [piece, ...piecesOnLayer])
    })
    return layersWithPieces
  }

  private addSpanningPiecesNotOnLayersFromActiveSegment(layersWithPieces: Map<string, Piece[]>): Map<string, Piece[]> {
    this.assertNotUndefined(this.activeCursor, 'active Cursor')

    const piecesToAdd: Piece[] = this.activeCursor.segment
      .getFirstSpanningPieceForEachLayerBeforePart(this.activeCursor.part, new Set(layersWithPieces.keys()))
      .map(this.setExecutedAtIfMissing)
    return this.addPiecesToLayers(piecesToAdd, layersWithPieces)
  }

  private setExecutedAtIfMissing(piece: Piece): Piece {
    if (!piece.getExecutedAt()) {
      piece.putOnAir(Date.now())
    }
    return piece
  }

  private addSpanningPiecesNotOnLayersFromPreviousSegments(layersWithPieces: Map<string, Piece[]>): Map<string, Piece[]> {
    const indexOfActiveSegment: number = this.segments.findIndex(segment => segment.id === this.activeCursor?.segment?.id)
    for (let i: number = indexOfActiveSegment - 1; i >= 0; i--) {
      const piecesSpanningSegment: Piece[] = this.segments[i]
        .getFirstSpanningRundownPieceForEachLayerForAllParts(new Set(layersWithPieces.keys()))
        .map(this.setExecutedAtIfMissing.bind(this))
      layersWithPieces = this.addPiecesToLayers(piecesSpanningSegment, layersWithPieces)
    }
    return layersWithPieces
  }

  private addBaselinePiecesNotOnLayers(layersWithPieces: Map<string, Piece[]>): void {
    this.baselinePieces.filter(baselinePiece => !layersWithPieces.has(baselinePiece.layer))
      .forEach((baselinePiece) => {
        if (!baselinePiece.getExecutedAt()) {
          baselinePiece.putOnAir(Date.now())
        }
        layersWithPieces.set(baselinePiece.layer, [baselinePiece])
      })
  }

  private setInfinitePieces(layersWithPieces: Map<string, Piece[]>): void {
    this.infinitePieces = new Map()
    layersWithPieces.forEach((piecesOnLayer: Piece[], layer: string) => {
      const infinitePieces: Piece[] = piecesOnLayer.filter(piece => piece.pieceLifespan !== PieceLifespan.WITHIN_PART)
      if (infinitePieces.length === 0) {
        return
      }
      this.infinitePieces.set(layer, infinitePieces)
    })
  }

  public setNextFromIds(segmentId: string, partId: string, owner?: Owner): void {
    this.assertActive(this.setNextFromIds.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')

    const nextSegment: Segment = this.findSegment(segmentId)
    if (nextSegment.invalidity) {
      throw new InvalidSegmentException(`Unable to set segment "${nextSegment.name}" as next, since it is invalid.`)
    }

    const nextPart: Part = nextSegment.findPart(partId)
    if (nextPart.invalidity) {
      throw new InvalidPartException(`Unable to set part "${nextPart.name}" as next, since it is invalid.`)
    }

    if (nextPart.isOnAir()) {
      throw new OnAirException('Can\'t set active part as next.')
    }

    if (this.nextCursor.segment.id !== segmentId) {
      this.unmarkNextSegment()
    }

    if (this.activeCursor?.part.id !== this.nextCursor?.part.id) {
      this.nextCursor?.part.reset()
    }
    this.unmarkNextPart()

    this.nextCursor = this.createCursor(this.nextCursor, { segment: nextSegment, part: nextPart, owner: owner ?? Owner.SYSTEM })

    this.markNextSegment()
    this.markNextPart()
  }

  public setNextFromDirection(direction: SetNextDirection, owner?: Owner): void {
    this.assertActive(this.setNextFromDirection.name)
    const nextCursor: RundownCursor = this.findNextCursorFromDirection(direction)
    this.setNextFromIds(nextCursor.segment.id, nextCursor.part.id, owner)
  }

  private findNextCursorFromDirection(direction: SetNextDirection): RundownCursor {
    switch (direction) {
      case SetNextDirection.PART_AFTER_NEXT_PART: {
        return this.findCursorWithPartAfterCurrentNextPart()
      }
      case SetNextDirection.PART_BEFORE_NEXT_PART: {
        return this.findCursorWithPartBeforeCurrentNextPart()
      }
      case SetNextDirection.SEGMENT_BEFORE_NEXT_SEGMENT: {
        return this.findCursorWithFirstPartInSegmentBeforeNextSegment()
      }
      case SetNextDirection.SEGMENT_AFTER_NEXT_SEGMENT: {
        return this.findCursorWithFirstPartInSegmentAfterNextSegment()
      }
    }
  }

  private findCursorWithPartAfterCurrentNextPart(): RundownCursor {
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    const currentNextSegment: Segment = this.nextCursor.segment
    const currentNextPart: Part = this.nextCursor.part
    try {
      const nextPart: Part = currentNextSegment.findNextPartNotOnAir(currentNextPart)
      return this.createCursorFromSegmentAndPart(currentNextSegment, nextPart)
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
      return this.findCursorWithFirstPartInSegmentAfterNextSegment()
    }
  }

  private createCursorFromSegmentAndPart(segment: Segment, part: Part): RundownCursor {
    return {
      segment,
      part,
      owner: Owner.SYSTEM
    }
  }

  private findCursorWithPartBeforeCurrentNextPart(): RundownCursor {
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    const currentNextSegment: Segment = this.nextCursor.segment
    const currentNextPart: Part = this.nextCursor.part
    try {
      const previousPart: Part = currentNextSegment.findPreviousValidPartNotOnAir(currentNextPart)
      return this.createCursorFromSegmentAndPart(currentNextSegment, previousPart)
    } catch (exception) {
      if (!(exception instanceof FirstPartInSegmentException)) {
        throw exception
      }
      return this.findCursorWithLastPartInSegmentBeforeNextSegment()
    }
  }

  private findCursorWithFirstPartInSegmentAfterNextSegment(): RundownCursor {
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    const currentNextSegment: Segment = this.nextCursor.segment

    const currentNextSegmentIndex: number = this.segments.findIndex(segment => segment.id === currentNextSegment.id)
    return this.findCursorWithFirstPartInSegmentAfterSegmentIndex(currentNextSegmentIndex)
  }

  private findCursorWithFirstPartInSegmentAfterSegmentIndex(segmentIndex: number): RundownCursor {
    if (segmentIndex === this.segments.length - 1) {
      throw new LastSegmentInRundownException('Unable to find the first Part of the next Segment. We are on the last Segment of the Rundown')
    }
    try {
      const nextSegment: Segment = this.findFirstValidSegmentAfterIndex(segmentIndex)
      const nextPart: Part = nextSegment.findFirstPartNotOnAir()
      return this.createCursorFromSegmentAndPart(nextSegment, nextPart)
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
      return this.findCursorWithFirstPartInSegmentAfterSegmentIndex(segmentIndex + 1)
    }
  }

  private findFirstValidSegmentAfterIndex(searchIndex: number): Segment {
    for (let i: number = searchIndex + 1; i < this.segments.length; i++) {
      const segment: Segment = this.segments[i]
      if (segment.isValid()) {
        return segment
      }
    }
    throw new LastSegmentInRundownException(`No valid Segments after SegmentIndex ${searchIndex}`)
  }

  private findCursorWithFirstPartInSegmentBeforeNextSegment(): RundownCursor {
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    const currentNextSegment: Segment = this.nextCursor.segment

    const currentNextSegmentIndex: number = this.segments.findIndex(segment => segment.id === currentNextSegment.id)
    return this.findCursorWithFirstPartInSegmentBeforeSegmentIndex(currentNextSegmentIndex)
  }

  private findCursorWithFirstPartInSegmentBeforeSegmentIndex(segmentIndex: number): RundownCursor {
    if (segmentIndex === 0) {
      throw new FirstSegmentInRundownException('Unable to set the first Part of the previous Segment. We are on the first Segment of the Rundown')
    }
    try {
      const previousSegment: Segment = this.findFirstValidSegmentBeforeIndex(segmentIndex)
      const nextPart: Part = previousSegment.findFirstPartNotOnAir()
      return this.createCursorFromSegmentAndPart(previousSegment, nextPart)
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
      return this.findCursorWithFirstPartInSegmentBeforeSegmentIndex(segmentIndex - 1)
    }
  }

  private findFirstValidSegmentBeforeIndex(searchIndex: number): Segment {
    for (let i: number = searchIndex - 1; i >= 0; i--) {
      const segment: Segment = this.segments[i]
      if (segment.isValid()) {
        return segment
      }
    }
    throw new FirstSegmentInRundownException(`No valid Segments before SegmentIndex ${searchIndex}`)
  }

  private findCursorWithLastPartInSegmentBeforeNextSegment(): RundownCursor {
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    const currentNextSegment: Segment = this.nextCursor?.segment

    const currentNextSegmentIndex: number = this.segments.findIndex(segment => segment.id === currentNextSegment.id)
    return this.findCursorWithLastPartInSegmentBeforeSegmentIndex(currentNextSegmentIndex)
  }

  private findCursorWithLastPartInSegmentBeforeSegmentIndex(segmentIndex: number): RundownCursor {
    if (segmentIndex === 0) {
      throw new FirstSegmentInRundownException('Unable to set last Part in previous Segment. We are on the first Segment of the Rundown')
    }
    try {
      const previousSegment: Segment = this.findFirstValidSegmentBeforeIndex(segmentIndex)
      const nextPart: Part = previousSegment.findLastPartNotOnAir()
      return this.createCursorFromSegmentAndPart(previousSegment, nextPart)
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error
      }
      return this.findCursorWithLastPartInSegmentBeforeSegmentIndex(segmentIndex - 1)
    }
  }

  private findSegment(segmentId: string): Segment {
    const segment: Segment | undefined = this.segments.find(segment => segment.id === segmentId)
    if (!segment) {
      throw new NotFoundException(`Segment "${segmentId}" does not exist in Rundown "${this.id}"`)
    }
    return segment
  }

  private compareSegments(segmentOne: Segment, segmentTwo: Segment): number {
    return segmentOne.rank - segmentTwo.rank
  }

  public addSegment(segment: Segment): void {
    if (this.segments.some(s => s.id === segment.id)) {
      throw new AlreadyExistException(`Unable to add Segment to Rundown. Segment ${segment.id} already exist on Rundown ${this.id}`)
    }
    this.segments.push(segment)
    this.segments.sort(this.compareSegments)

    this.updateNextCursor()
  }

  private updateNextCursor(): void {
    if (!this.isActive()) {
      return
    }

    const nextCursorSegment: Segment | undefined = this.segments.find(segment => segment.id === this.nextCursor?.segment.id)
    const isNextSegmentSameObjectReferenceAsNextCursorSegment: boolean = nextCursorSegment === this.nextCursor?.segment
    if (nextCursorSegment && !isNextSegmentSameObjectReferenceAsNextCursorSegment) {
      this.nextCursor = this.createCursor(this.nextCursor, { segment: nextCursorSegment })
    }

    const nextCursorPart: Part | undefined = nextCursorSegment?.getParts().find(part => part.id === this.nextCursor?.part.id)
    const isNextPartSameObjectReferenceAsNextCursorPart: boolean = nextCursorPart === this.nextCursor?.part
    if (nextCursorPart && !isNextPartSameObjectReferenceAsNextCursorPart && !nextCursorPart.invalidity) {
      nextCursorPart.setAsNext()
      this.nextCursor = this.createCursor(this.nextCursor, { part: nextCursorPart })
    }

    if (this.nextCursor
      && this.nextCursor.owner === Owner.EXTERNAL
      && nextCursorSegment
      && nextCursorPart
      && !nextCursorPart.invalidity
    ) {
      return
    }

    this.setNextFromActive(Owner.SYSTEM)
  }

  public updateSegment(segment: Segment): void {
    const segmentIndex: number = this.segments.findIndex(s => s.id === segment.id)
    if (segmentIndex < 0) {
      throw new NotFoundException(`Segment ${segment.id} does not belong to Rundown ${this.id}`)
    }

    const oldSegment: Segment = this.segments[segmentIndex]
    if (oldSegment.isOnAir()) {
      const newOnAirPart: Part | undefined = segment.getParts().find(part => part.isOnAir())
      if (newOnAirPart) {
        this.activeCursor = this.createCursor(this.activeCursor, { part: newOnAirPart })
      }

      segment.putOnAir()
      this.activeCursor = this.createCursor(this.activeCursor, { segment })
      this.updateInfinitePieces()
    }

    this.segments[segmentIndex] = segment
    this.segments.sort(this.compareSegments)

    this.updateNextCursor()
  }

  public removeUnsyncedSegment(unsyncedSegment: Segment): void {
    if (unsyncedSegment.isOnAir()) {
      throw new UnsupportedOperationException(`Trying to remove an unsynced Segment ${unsyncedSegment.id} from the Rundown while it is still on Air`)
    }
    this.segments = this.segments.filter(segment => segment.id !== unsyncedSegment.id)
  }

  /**
   * Removes the Segment belonging to IngestSegmentId.
   * Returns the removed Segment or undefined if the Segment doesn't exist on the Rundown
   * If the Segment is currently OnAir, the Segment is still removed, but an "unsynced copy" is created of the Segment and added to the Rundown in its place.
   */
  public removeSegment(segmentId: string): Segment | undefined {
    const segmentToRemove: Segment | undefined = this.segments.find(segment => !segment.isUnsynced() && segment.id === segmentId)
    if (!segmentToRemove) {
      return
    }

    this.segments = this.segments.filter(segment => segment.id !== segmentId)

    if (segmentToRemove.isOnAir()) {
      const unsyncedSegment: Segment = this.unsyncSegment(segmentToRemove)
      this.updateNextCursor()
      return unsyncedSegment
    }

    this.updateNextCursor()
    return segmentToRemove
  }

  private unsyncSegment(segmentToUnsync: Segment): Segment {
    segmentToUnsync.markAsUnsynced()
    const unsyncedSegment: Segment = segmentToUnsync.getUnsyncedCopy()
    const unsyncedPart: Part | undefined = unsyncedSegment.getParts().find(part => part.isOnAir())
    if (!unsyncedPart) {
      throw new NotFoundException(`Unsynced onAir Part not found in unsynced Segment ${unsyncedSegment.id}`)
    }
    this.activeCursor = this.createCursor(this.activeCursor, { segment: unsyncedSegment, part: unsyncedPart })
    this.segments.push(unsyncedSegment)
    this.segments.sort(this.compareSegments)
    return unsyncedSegment
  }

  public getSegments(): readonly Segment[] {
    return this.segments
  }

  public addPart(part: Part): void {
    const segment: Segment | undefined = this.segments.find(segment => segment.id === part.getSegmentId())
    if (!segment) {
      throw new NotFoundException(`Unable to find segment with id '${part.getSegmentId()}' when adding part '${part.name}' with id '${part.id}' in rundown '${this.name}' with id '${this.id}'.`)
    }
    segment.addPart(part)
    this.updateNextCursor()
  }

  public updatePart(part: Part): void {
    const segment: Segment | undefined = this.segments.find(segment => segment.id === part.getSegmentId())
    if (!segment) {
      throw new NotFoundException(`Unable to find segment with id '${part.getSegmentId()}' when updating part '${part.name}' with id '${part.id}' in rundown '${this.name}' with id '${this.id}'.`)
    }
    segment.updatePart(part)
    if (this.activeCursor?.part.id === part.id) {
      this.activeCursor = this.createCursor(this.activeCursor, { part })
    }
    if (this.nextCursor?.part.id === part.id) {
      part.setAsNext()
      this.nextCursor = this.createCursor(this.nextCursor, { part })
      return
    }
    this.updateNextCursor()
  }

  public removePartFromSegment(partId: string): Part | undefined {
    const segment: Segment | undefined = this.segments.find(segment => segment.getParts().some(part => part.id === partId))
    if (!segment) {
      throw new NotFoundException(`Unable to find segment for part with id '${partId}' in rundown ${this.id}.`)
    }
    const removedPart: Part | undefined = segment.removePart(partId)
    if (removedPart?.isOnAir()) {
      this.activeCursor = this.createCursor(this.activeCursor, { part: removedPart })
    }

    this.markInfinitePiecesFromPartUnsynced(partId)
    this.updateNextCursor()

    return removedPart
  }

  private markInfinitePiecesFromPartUnsynced(partId: string): void {
    const infinitePiecesFromPart: Piece[] = this.getInfinitePieces().filter(piece => piece.getPartId() === partId)
    infinitePiecesFromPart.map((piece) => {
      piece.markAsUnsynced()
      return piece.getUnsyncedCopy()
    }).forEach(unsyncedPiece => this.infinitePieces.set(unsyncedPiece.layer, [unsyncedPiece]))
  }

  public getInfinitePieces(): Piece[] {
    return Array.from(this.infinitePieces.values()).flat()
  }

  public getInfinitePiecesMap(): Map<string, Piece[]> {
    return this.infinitePieces
  }

  public reset(): void {
    this.clearActiveCursor()
    this.clearNextCursor()
    this.infinitePieces = new Map()
    this.previousPart = undefined
    this.persistentState = undefined

    this.removeUnsyncedSegments()
    this.resetSegments()
    this.resetHistory()

    if (this.mode !== RundownMode.INACTIVE) {
      this.setFirstSegmentAndPartNextCursor()
    }
  }

  private clearNextCursor(): void {
    this.unmarkNextSegment()
    this.unmarkNextPart()
    this.nextCursor = undefined
  }

  public getPersistentState(): RundownPersistentState {
    return this.persistentState
  }

  public setPersistentState(rundownPersistentState: RundownPersistentState): void {
    this.persistentState = rundownPersistentState
  }

  public insertPartAsNext(part: Part, nextCursorOwner?: Owner): void {
    this.assertActive(this.insertPartAsNext.name)
    this.assertNotUndefined(this.activeCursor, 'active Segment')

    this.updateRankFromOnAirPart(part)
    this.activeCursor.segment.insertPartAfterActivePart(part)
    this.setNextFromIds(this.activeCursor.segment.id, part.id, nextCursorOwner)
  }

  private updateRankFromOnAirPart(partToBeUpdated: Part): void {
    if (!this.activeCursor) {
      return
    }

    const onAirPart: Part = this.activeCursor.part
    const onAirSegment: Segment = this.activeCursor.segment

    try {
      const partAfterOnAirPart: Part = onAirSegment.findNextPartNotOnAir(onAirPart)
      const newRank: number = (partAfterOnAirPart.getRank() - onAirPart.getRank()) / 2 + onAirPart.getRank()
      partToBeUpdated.updateRank(newRank)
    } catch (error) {
      if (!(error instanceof LastPartInSegmentException)) {
        throw error
      }
      partToBeUpdated.updateRank(onAirPart.getRank() + 1)
    }
  }

  public stopActivePiecesOnLayers(layers: string[]): void {
    this.assertActive(this.stopActivePiecesOnLayers.name)
    const piecesToStop: Piece[] = [
      ...this.getActiveCursor()?.part.getPieces().filter(piece => layers.includes(piece.layer) && !piece.hasEnded(Date.now())) ?? [],
      ...layers.map(layer => this.infinitePieces.get(layer)).flat().filter((piece): piece is Piece => !!piece)
    ]

    const now: number = Date.now()
    piecesToStop.forEach(piece => piece.takeOffAir(now))
  }

  public stopPiece(pieceId: string): Piece | undefined {
    this.assertActive(this.stopPiece.name)
    const pieceToStop: Piece | undefined = this.getActivePart().getPieces().concat(this.getInfinitePieces()).find(piece => piece.id === pieceId)
    pieceToStop?.takeOffAir(Date.now())
    return pieceToStop
  }

  public insertPieceIntoActivePart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoActivePart.name)
    this.assertNotUndefined(this.activeCursor, 'active Part')

    this.activeCursor.part.insertPiece(piece)
    this.updateInfinitePieces()
  }

  public insertPieceIntoNextPart(piece: Piece, partInTransition?: InTransition, nextCursorOwner?: Owner): void {
    this.assertActive(this.insertPieceIntoNextPart.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    this.nextCursor.part.insertPiece(piece)
    if (partInTransition) {
      this.nextCursor.part.updateInTransition(partInTransition)
    }
    if (nextCursorOwner) {
      this.nextCursor = this.createCursor(this.nextCursor, { owner: nextCursorOwner })
    }
  }

  public getActiveCursor(): RundownCursor | undefined {
    return this.activeCursor
  }

  public getNextCursor(): RundownCursor | undefined {
    return this.nextCursor
  }

  public replacePiece(pieceToBeReplaced: Piece, newPiece: Piece): void {
    this.assertActive(this.replacePiece.name)
    if (this.getActivePart().id === pieceToBeReplaced.getPartId()) {
      this.getActivePart().replacePiece(pieceToBeReplaced, newPiece)
      return
    }

    if (this.getNextPart().id === pieceToBeReplaced.getPartId()) {
      this.getNextPart().replacePiece(pieceToBeReplaced, newPiece)
      return
    }

    throw new UnsupportedOperationException(`Can't replace Piece on Rundown ${this.id}. Piece ${pieceToBeReplaced.id} is neither on the active or next Part.`)
  }

  public getHistory(): Part[] {
    return this.history
  }

  public findPartInHistory(predicate: (part: Part) => boolean): Part {
    const historicPart: Part | undefined = [...this.history, this.getActivePart().clone()].reverse().find(predicate)
    if (!historicPart) {
      throw new NoPartInHistoryException(`Rundown ${this.id} does not contain a Part with the specified conditions in its history`)
    }
    return historicPart
  }

  public getPart(partId: string): Part | undefined {
    const segmentForPart: Segment | undefined = this.segments.find(segment => segment.getParts().some(part => part.id === partId))
    if (!segmentForPart) {
      return
    }
    return segmentForPart.findPart(partId)
  }

  /**
   * Removes 'old' unplanned Parts on the active Segment.
   * When called, if there are more Parts on the active Segment than the given threshold, then all old unplanned Parts will be removed from the Segment.
   * Default prune threshold is 100 Parts.
   * An unplanned Part is old if it's not the active, previous or next Part.
   * Pruning is necessary if Parts are continued to be inserted into the same Segment. (Requires 400+ Parts in a Segment to be noticeable)
   * Returns a list of PartIds of the Part that was pruned. Returns an empty list of no Parts where pruned.
   */
  public pruneOldUnplannedPartsOnActiveSegment(pruneThreshold: number = 100): string[] {
    if (this.getActiveSegment().getParts().length < pruneThreshold) {
      return []
    }

    const activePartIndex: number = this.getActiveSegment().getParts().findIndex(part => part.isOnAir())
    const partsToPruneIds: string[] = this.getActiveSegment().getParts().filter((part: Part, index: number) => {
      if (index >= activePartIndex || part.id === this.previousPart?.id) {
        return false
      }
      return !part.isPlanned
    }).map(part => part.id)

    partsToPruneIds.forEach(partId => this.getActiveSegment().removePart(partId))
    return partsToPruneIds
  }

  public getBaselinePieces(): Piece[] {
    return this.baselinePieces
  }

  public updateBaselinePieces(baselinePieces: Piece[]): void {
    this.baselinePieces = baselinePieces.filter(piece => piece.rundownId === this.id)
  }
}
