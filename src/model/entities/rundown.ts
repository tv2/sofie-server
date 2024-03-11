import { Segment } from './segment'
import { Part } from './part'
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
import { UnsupportedOperationException } from '../exceptions/unsupported-operation-exception'
import { RundownCursor } from '../value-objects/rundown-cursor'
import { Owner } from '../enums/owner'
import { AlreadyExistException } from '../exceptions/already-exist-exception'
import { LastSegmentInRundownException } from '../exceptions/last-segment-in-rundown-exception'
import { NoPartInHistoryException } from '../exceptions/no-part-in-history-exception'
import { OnAirException } from '../exceptions/on-air-exception'
import { RundownTiming } from '../value-objects/rundown-timing'
import { InTransition } from '../value-objects/in-transition'
import { RundownMode } from '../enums/rundown-mode'

export interface RundownInterface {
  id: string
  name: string
  showStyleVariantId: string
  segments: Segment[]
  baselineTimelineObjects: TimelineObject[]
  mode: RundownMode
  modifiedAt: number
  persistentState?: RundownPersistentState
  history: Part[]
  timing: RundownTiming

  alreadyActiveProperties?: RundownAlreadyActiveProperties
}

export interface RundownAlreadyActiveProperties {
  activeCursor: RundownCursor | undefined
  nextCursor: RundownCursor | undefined
  infinitePieces: Map<string, Piece>
}

const MAXIMUM_HISTORY_ENTRIES: number = 30

export class Rundown extends BasicRundown {
  private readonly baselineTimelineObjects: TimelineObject[]
  private segments: Segment[]

  private activeCursor?: RundownCursor
  private nextCursor?: RundownCursor

  private previousPart?: Part

  private infinitePieces: Map<string, Piece> = new Map()

  private persistentState?: RundownPersistentState

  private readonly showStyleVariantId: string

  private history: Part[]

  constructor(rundown: RundownInterface) {
    super(rundown.id, rundown.name, rundown.mode, rundown.modifiedAt, rundown.timing)
    this.segments = rundown.segments ? [...rundown.segments].sort(this.compareSegments) : []
    this.baselineTimelineObjects = rundown.baselineTimelineObjects ?? []
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
    }
  }

  public activate(): void {
    if (this.isActive()) {
      throw new AlreadyActivatedException('Can\'t activate Rundown since it is already activated')
    }
    this.resetSegments()
    this.resetHistory()
    this.infinitePieces = new Map()
    this.mode = RundownMode.ACTIVE

    const firstSegment: Segment = this.findFirstSegment()
    firstSegment.setAsNext()
    const firstPart: Part = firstSegment.findFirstPart()
    firstPart.setAsNext()
    this.nextCursor = {
      part: firstPart,
      segment: firstSegment,
      owner: Owner.SYSTEM
    }
  }

  private resetHistory(): void {
    this.history = []
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
    const segment: Segment | undefined = this.segments.find(segment => this.isSegmentValidForRundownExecution(segment))
    if (!segment) {
      throw new NotFoundException(`Unable to find first valid Segment for Rundown ${this.id}`)
    }
    return segment
  }

  private isSegmentValidForRundownExecution(segment: Segment): boolean {
    return !segment.isHidden && segment.getParts().length > 0
  }

  private setNextFromActive(owner: Owner): void {
    this.unmarkNextPart()

    if (!this.activeCursor) {
      return
    }

    try {
      const nextPart: Part = this.activeCursor.segment.findNextPart(this.activeCursor.part)
      const nextSegment: Segment | undefined = this.segments.find(segment => segment.id === nextPart.getSegmentId())
      this.nextCursor = this.createCursor(this.nextCursor, { segment: nextSegment, part: nextPart, owner })
      this.markNextPart()
      return
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
    }

    this.unmarkNextSegment()
    try {
      const segment: Segment = this.findNextValidSegment()
      this.nextCursor = this.createCursor(this.nextCursor, { segment, part: segment.findFirstPart(), owner })
      this.markNextSegment()
    } catch (error) {
      if (!(error instanceof LastSegmentInRundownException)) {
        throw error
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

  private findNextValidSegment(): Segment {
    const activeSegmentIndex: number = this.segments.findIndex((segment) => segment.id === this.activeCursor?.segment?.id)
    if (activeSegmentIndex === -1) {
      throw new NotFoundException('Active Segment does not exist in Rundown')
    }

    const nextValidSegment: Segment | undefined = this.segments.slice(activeSegmentIndex + 1).find(segment => this.isSegmentValidForRundownExecution(segment))
    if (!nextValidSegment) {
      throw new LastSegmentInRundownException(`Segment: ${this.activeCursor?.segment?.id} is the last valid Segment of Rundown: ${this.id}`)
    }

    return nextValidSegment
  }

  public deactivate(): void {
    this.assertActive(this.deactivate.name)
    this.deactivateActivePartAndSegment()
    this.unmarkNextSegment()
    this.unmarkNextPart()
    this.segments.forEach(segment => segment.takeOffAir())
    this.nextCursor = undefined
    this.infinitePieces = new Map()
    this.mode = RundownMode.INACTIVE
    this.previousPart = undefined
    this.persistentState = undefined
  }

  private assertActive(operationName: string): void {
    if (this.mode === RundownMode.INACTIVE) {
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
      return this.segments[segmentIndexForPart].findNextPart(part)
    } catch (exception) {
      if (!(exception instanceof LastPartInSegmentException)) {
        throw exception
      }
      if (segmentIndexForPart + 1 === this.segments.length) {
        throw new LastPartInRundownException(`Part: ${part.id} is the last Part of Rundown: ${this.id}`)
      }
      return this.findFirstPartOfValidSegmentSkippingUnsyncedSegments(segmentIndexForPart + 1)
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

  private findFirstPartOfValidSegmentSkippingUnsyncedSegments(indexToSearchFrom: number): Part {
    while (indexToSearchFrom < this.segments.length) {
      if (!this.segments[indexToSearchFrom].isUnsynced() && this.isSegmentValidForRundownExecution(this.segments[indexToSearchFrom])) {
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

    const nextSegment: Segment = this.findSegment(segmentId)
    const nextPart: Part = nextSegment.findPart(partId)

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
    if (nextCursorPart && !isNextPartSameObjectReferenceAsNextCursorPart) {
      nextCursorPart.setAsNext()
      this.nextCursor = this.createCursor(this.nextCursor, { part: nextCursorPart })
    }

    if (this.nextCursor
      && this.nextCursor.owner === Owner.EXTERNAL
      && nextCursorSegment
      && nextCursorPart
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
      segment.setParts(oldSegment.getParts())
      segment.putOnAir()
      this.activeCursor = this.createCursor(this.activeCursor, { segment })
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
    this.activeCursor = this.createCursor(this.activeCursor, { segment: unsyncedSegment, part:  unsyncedPart })
    this.segments.push(unsyncedSegment)
    this.segments.sort(this.compareSegments)
    return unsyncedSegment
  }

  public getSegments(): Segment[] {
    return this.segments
  }

  public addPart(part: Part): void {
    const segment: Segment | undefined = this.segments.find(segment => segment.id === part.getSegmentId())
    if (!segment) {
      throw new NotFoundException(`Unable to find Segment for Part ${part.id} in Rundown ${this.id}`)
    }
    segment.addPart(part)
    this.updateNextCursor()
  }

  public updatePart(part: Part): void {
    const segment: Segment | undefined = this.segments.find(segment => segment.id === part.getSegmentId())
    if (!segment) {
      throw new NotFoundException(`Unable to find Segment for Part ${part.id} in Rundown ${this.id}`)
    }
    segment.updatePart(part)
    this.updateNextCursor()
  }

  public removePartFromSegment(partId: string): Part | undefined {
    const segment: Segment | undefined = this.segments.find(segment => segment.getParts().some(part => part.id === partId))
    if (!segment) {
      throw new NotFoundException(`Unable to find Segment for Part ${partId} in Rundown ${this.id}`)
    }
    const removedPart: Part | undefined = segment.removePart(partId)

    this.markInfinitePiecesFromPartUnsynced(partId)
    this.updateNextCursor()

    return removedPart
  }

  private markInfinitePiecesFromPartUnsynced(partId: string): void {
    const infinitePiecesFromPart: Piece[] = [...this.infinitePieces.values()].filter(piece => piece.getPartId() === partId)
    infinitePiecesFromPart.map(piece => {
      piece.markAsUnsynced()
      return piece.getUnsyncedCopy()
    }).forEach(unsyncedPiece => this.infinitePieces.set(unsyncedPiece.layer, unsyncedPiece))
  }

  public getInfinitePieces(): Piece[] {
    return Array.from(this.infinitePieces.values())
  }

  public getInfinitePiecesMap(): Map<string, Piece> {
    return this.infinitePieces
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

  public stopActivePiecesOnLayers(layers: string[]): void {
    this.assertActive(this.stopActivePiecesOnLayers.name)
    const piecesToStop: Piece[] = [
      ...this.getActiveCursor()?.part.getPieces().filter(piece => layers.includes(piece.layer)) ?? [],
      ...layers.map(layer => this.infinitePieces.get(layer)).filter((piece): piece is Piece => !!piece)
    ]

    piecesToStop.forEach(piece => piece.stop())
  }

  public insertPieceIntoActivePart(piece: Piece): void {
    this.assertActive(this.insertPieceIntoActivePart.name)
    this.assertNotUndefined(this.activeCursor, 'active Part')

    this.activeCursor.part.insertPiece(piece)
    this.updateInfinitePieces()
  }

  public insertPieceIntoNextPart(piece: Piece, partInTransition?: InTransition): void {
    this.assertActive(this.insertPieceIntoNextPart.name)
    this.assertNotUndefined(this.nextCursor, 'next Cursor')
    this.nextCursor.part.insertPiece(piece)
    if (partInTransition) {
      this.nextCursor.part.updateInTransition(partInTransition)
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
}
