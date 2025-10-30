import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { Piece } from './piece'
import { PieceLifespan } from '../enums/piece-lifespan'
import { AlreadyExistException } from '../exceptions/already-exist-exception'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'
import { Invalidity } from '../value-objects/invalidity'
import { InvalidSegmentException } from '../exceptions/invalid-segment-exception'
import { FirstPartInSegmentException } from '../exceptions/first-part-in-segment-exception'

export interface SegmentInterface {
  id: string
  rundownId: string
  name: string
  rank: number
  isHidden: boolean
  referenceTag?: string
  metadata?: unknown
  parts: Part[]
  isOnAir: boolean
  isNext: boolean
  isUnsynced: boolean
  executedAtEpochTime?: number
  expectedDurationInMs?: number
  invalidity?: Invalidity
  definesShowStyleVariant: boolean
}

export class Segment {
  public readonly id: string
  public readonly rundownId: string
  public readonly name: string
  public readonly expectedDurationInMs?: number
  public readonly isHidden: boolean
  public readonly referenceTag?: string
  public readonly metadata?: unknown
  public readonly invalidity?: Invalidity
  public readonly definesShowStyleVariant: boolean
  public rank: number

  private isSegmentOnAir: boolean
  private isSegmentNext: boolean
  private isSegmentUnsynced: boolean = false
  private executedAtEpochTime?: number

  private parts: Part[]

  public constructor(segment: SegmentInterface) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.rank = segment.rank
    this.isHidden = segment.isHidden
    this.referenceTag = segment.referenceTag
    this.metadata = segment.metadata
    this.isSegmentOnAir = segment.isOnAir
    this.isSegmentNext = segment.isNext
    this.isSegmentUnsynced = segment.isUnsynced
    this.expectedDurationInMs = segment.expectedDurationInMs
    this.executedAtEpochTime = segment.executedAtEpochTime
    this.invalidity = segment.invalidity
    this.definesShowStyleVariant = segment.definesShowStyleVariant
    this.setParts(segment.parts ?? [])
  }

  public findFirstPart(): Part {
    const part: Part | undefined = this.parts.find(part => !part.invalidity)
    if (!part) {
      throw new NotFoundException(`Segment '${this.name}' with id '${this.id}' has no valid parts.`)
    }
    return part
  }

  public findFirstPartNotOnAir(): Part {
    const part: Part | undefined = this.parts.find(part => !part.invalidity && !part.isOnAir())
    if (!part) {
      throw new NotFoundException(`Segment '${this.name}' with id '${this.id}' has no valid off air parts.`)
    }
    return part
  }

  public findLastPartNotOnAir(): Part {
    // Array.reverse() reverse the array in place. To not mess with the original array, we make a "copy" of it.
    // Array.findLast() would be preferred by that requires a higher node version that what we currently support.
    const part: Part | undefined = this.parts.map(part => part).reverse().find(part => !part.invalidity && !part.isOnAir())

    if (!part) {
      throw new NotFoundException(`Segment '${this.name}' with id '${this.id}' has no valid parts.`)
    }
    return part
  }

  public putOnAir(): void {
    this.assertValidity(this.putOnAir.name)
    this.isSegmentOnAir = true
    this.executedAtEpochTime ??= Date.now()
  }

  private assertValidity(operationName: string): void {
    if (!this.invalidity) {
      return
    }
    throw new InvalidSegmentException(`Unable to do "${operationName}", since segment "${this.name}" with id is invalid.`)
  }

  public takeOffAir(): void {
    this.isSegmentOnAir = false
  }

  public getExecutedAtEpochTime(): number | undefined {
    return this.executedAtEpochTime
  }

  public removeUnsyncedParts(): void {
    this.parts = this.parts.filter(part => !part.isUnsynced())
  }

  public isOnAir(): boolean {
    return this.isSegmentOnAir
  }

  public isUnsynced(): boolean {
    return this.isSegmentUnsynced
  }

  public markAsUnsynced(): void {
    this.isSegmentUnsynced = true
    this.rank = this.rank - 1
    this.parts.forEach(part => part.markAsUnsyncedWithUnsyncedSegment())
    this.parts = this.parts.filter(part => part.isOnAir()).map(part => part.getUnsyncedCopy())
  }

  public setAsNext(): void {
    this.assertValidity(this.setAsNext.name)
    this.isSegmentNext = true
    if (!this.isSegmentOnAir) {
      this.reset()
    }
  }

  public removeAsNext(): void {
    this.isSegmentNext = false
  }

  public isNext(): boolean {
    return this.isSegmentNext
  }

  public findNextPartNotOnAir(fromPart: Part): Part {
    const fromPartIndex: number = this.parts.findIndex(part => part.id === fromPart.id)
    if (fromPartIndex === -1) {
      throw new NotFoundException(`Part '${fromPart.name}' with id '${fromPart.id}' does not exist in segment '${this.name}' with id '${this.id}'. Segment contains the following parts: ${this.parts.map(part => `${part.name} (${part.id})`).join(', ')}.`)
    }
    const nextPart: Part | undefined = this.parts.slice(fromPartIndex + 1).find(part => !part.invalidity && !part.isOnAir())
    if (!nextPart) {
      throw new LastPartInSegmentException(`The part '${fromPart.name}' with id "${fromPart.id}" is the last part in the segment "${this.name}" with id "${this.id}".`)
    }
    return nextPart
  }

  public findPreviousValidPartNotOnAir(fromPart: Part): Part {
    const fromPartIndex: number = this.parts.findIndex(part => part.id === fromPart.id)
    if (fromPartIndex === -1) {
      throw new NotFoundException(`Part '${fromPart.name}' with id '${fromPart.id}' does not exist in segment '${this.name}' with id '${this.id}'. Segment contains the following parts: ${this.parts.map(part => `${part.name} (${part.id})`).join(', ')}.`)
    }

    const previousPart: Part | undefined = this.parts
      .slice(0, fromPartIndex)
      .reverse()
      .find(part => !part.invalidity && !part.isOnAir())

    if (!previousPart) {
      throw new FirstPartInSegmentException(`Unable to find a part in the segment '${this.name}' with id '${this.id}' that is before the part '${fromPart.name}' with id '${fromPart.id}' as it is the first.`)
    }

    return previousPart
  }

  public findPart(partId: string): Part {
    const part: Part | undefined = this.parts.find(part => part.id === partId)
    if (!part) {
      throw new NotFoundException(`Part '${partId}' does not exist in segment '${this.name}' with id '${this.id}'.`)
    }
    return part
  }

  public setParts(parts: Part[]): void {
    this.parts = parts.sort(this.compareParts)
  }

  private compareParts(partOne: Part, partTwo: Part): number {
    return partOne.getRank() - partTwo.getRank()
  }

  public addPart(partToAdd: Part): void {
    if (!this.isInsertingPartAllowed(partToAdd)) {
      return
    }

    const doesPartAlreadyExistOnSegment: boolean = this.parts.some(part => part.id === partToAdd.id)
    if (doesPartAlreadyExistOnSegment) {
      throw new AlreadyExistException(`Unable to add the part '${partToAdd.name}' with id '${partToAdd.id}' to the segment '${this.name}' with id '${this.id}'. The part already exists on the segment.`)
    }
    this.parts.push(partToAdd)
    this.parts.sort(this.compareParts)
  }

  private isInsertingPartAllowed(part: Part): boolean {
    // We are not allowed to insert Parts into unsynced Segments unless it's the active Part!
    return !this.isUnsynced() || part.isOnAir()
  }

  public updatePart(part: Part): void {
    const partIndex: number = this.parts.findIndex(p => p.id === part.id)
    if (partIndex < 0) {
      throw new NotFoundException(`Part '${part.name}' with id '${part.id}' does not belong to segment '${this.name}' with id '${this.id}'.`)
    }
    this.parts[partIndex] = part
    this.parts.sort(this.compareParts)
  }

  /**
   * Returns the removed Part or undefined if the Part doesn't exist on the Segment
   */
  public removePart(partId: string): Part | undefined {
    const partToDelete: Part | undefined = this.parts.find(part => part.id === partId)
    if (!partToDelete) {
      return undefined
    }

    if (partToDelete.isOnAir()) {
      partToDelete.markAsUnsynced()
      const unsyncedPart: Part = partToDelete.getUnsyncedCopy()
      this.parts = this.parts.map(part => part.id === partId ? unsyncedPart : part)
      return unsyncedPart
    }
    this.parts = this.parts.filter(part => part.id !== partId)
    return partToDelete
  }

  public getParts(): readonly Part[] {
    return this.parts
  }

  public getFirstSpanningPieceForEachLayerBeforePart(part: Part, layersToIgnore: Set<string>): Piece[] {
    const indexOfPart: number = this.parts.findIndex(p => p.id === part.id)
    return this.getPiecesOnUnusedLayersFromIndexToStart(indexOfPart - 1, layersToIgnore, [
      PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
      PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
      PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
    ])
  }

  private getPiecesOnUnusedLayersFromIndexToStart(
    startIndex: number,
    usedLayers: Set<string>,
    lifespans: PieceLifespan[]
  ): Piece[] {
    const now: number = Date.now()
    return this.parts
      .slice(0, startIndex + 1)
      .flatMap(part => part.getPiecesWithLifespan(lifespans))
      .filter(piece => !piece.hasEnded(now))
      .reduceRight(this.createGetPiecesOnUnusedLayersReducer(usedLayers), [])
  }

  private createGetPiecesOnUnusedLayersReducer(
    originalUsedLayers: Set<string>
  ): (pieces: Piece[], piece: Piece) => Piece[] {
    const usedLayers: Set<string> = new Set(originalUsedLayers)
    return (pieces: Piece[], piece: Piece) => {
      if (!usedLayers.has(piece.layer)) {
        pieces.push(piece)
        usedLayers.add(piece.layer)
      }
      return pieces
    }
  }

  public getFirstSpanningRundownPieceForEachLayerForAllParts(layersToIgnore: Set<string>): Piece[] {
    return this.getPiecesOnUnusedLayersFromIndexToStart(this.parts.length - 1, layersToIgnore, [
      PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
    ])
  }

  public doesPieceBelongToSegment(piece: Piece): boolean {
    return this.parts.some(part => part.id === piece.getPartId())
  }

  public reset(): void {
    this.removeUnplannedParts()
    this.removeUnsyncedParts()
    this.parts.forEach(part => part.reset())
    this.executedAtEpochTime = undefined
  }

  private removeUnplannedParts(): void {
    this.parts = this.parts.filter(part => part.isPlanned)
  }

  public insertPartAfterActivePart(partToInsert: Part): void {
    const activePartIndex: number = this.parts.findIndex(part => part.isOnAir())
    if (activePartIndex < 0) {
      throw new NotFoundException(`Unable to insert part '${partToInsert.name}' with id '${partToInsert.id}' into the segment '${this.name}' with id '${this.id}' because the segment does not have an active part.`)
    }

    partToInsert.setSegmentId(this.id)

    const isActivePartLastPartInSegment: boolean = activePartIndex + 1 === this.parts.length
    if (isActivePartLastPartInSegment) {
      this.parts.push(partToInsert)
      return
    }

    const isPartAfterActivePartAnUnplannedPart: boolean = !this.parts[activePartIndex + 1].isPlanned
    if (isPartAfterActivePartAnUnplannedPart) {
      this.parts[activePartIndex + 1] = partToInsert
      return
    }

    this.parts.splice(activePartIndex + 1, 0, partToInsert)
  }

  public getUnsyncedCopy(): Segment {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: `${this.id}${UNSYNCED_ID_POSTFIX}` })
  }

  public isSegmentUntimed(): boolean {
    return !this.getParts().some(part => !part.isUntimed())
  }

  public isValid(): boolean {
    return !this.invalidity && !this.isHidden && this.parts.some(part => !part.invalidity)
  }
}
