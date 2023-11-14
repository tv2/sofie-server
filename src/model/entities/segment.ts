import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { Piece } from './piece'
import { PieceLifespan } from '../enums/piece-lifespan'
import { AlreadyExistException } from '../exceptions/already-exist-exception'
import { UNSYNCED_ID_POSTFIX } from '../value-objects/unsynced_constants'

export interface SegmentInterface {
  id: string
  rundownId: string
  name: string
  rank: number
  parts: Part[]
  isOnAir: boolean
  isNext: boolean
  isUnsynced: boolean
  budgetDuration?: number
}

export class Segment {
  public readonly id: string
  public readonly rundownId: string
  public name: string
  public rank: number
  public budgetDuration?: number

  private isSegmentOnAir: boolean
  private isSegmentNext: boolean
  private isSegmentUnsynced: boolean = false

  private parts: Part[]

  constructor(segment: SegmentInterface) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.rank = segment.rank
    this.isSegmentOnAir = segment.isOnAir
    this.isSegmentNext = segment.isNext
    this.isSegmentUnsynced = segment.isUnsynced
    this.budgetDuration = segment.budgetDuration
    this.setParts(segment.parts ?? [])
  }

  public findFirstPart(): Part {
    if (this.parts.length === 0) {
      throw new NotFoundException(`Segment '${this.name}' with id '${this.id}' has no parts.`)
    }
    return this.parts[0]
  }

  public putOnAir(): void {
    this.isSegmentOnAir = true
  }

  public takeOffAir(): void {
    this.isSegmentOnAir = false
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

  public findNextPart(fromPart: Part): Part {
    const fromPartIndex: number = this.parts.findIndex((part) => part.id === fromPart.id)
    if (fromPartIndex === -1) {
      throw new NotFoundException('Part does not exist in Segment')
    }
    if (fromPartIndex + 1 === this.parts.length) {
      throw new LastPartInSegmentException(`Part: ${fromPart.id} is the last Part in Segment: ${this.id}`)
    }
    return this.parts[fromPartIndex + 1]
  }

  public findPart(partId: string): Part {
    const part: Part | undefined = this.parts.find((part) => part.id === partId)
    if (!part) {
      throw new NotFoundException(`Part "${partId}" does not exist in Segment "${this.id}"`)
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
      throw new AlreadyExistException(`Unable to add Part to Segment. Part ${partToAdd.id} already exist on Segment ${this.id}`)
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
      throw new NotFoundException(`Part ${part.id} does not belong to Segment ${this.id}`)
    }
    this.parts[partIndex] = part
    this.parts.sort(this.compareParts)
  }

  public removePart(partId: string): void {
    const partToDelete: Part | undefined = this.parts.find(part => part.id === partId)
    if (!partToDelete) {
      return
    }

    if (partToDelete.isOnAir()) {
      partToDelete.markAsUnsynced()
      return
    }
    this.parts = this.parts.filter(p => p.id !== partId)
  }

  public getParts(): Part[] {
    return this.parts
  }

  public getFirstSpanningPieceForEachLayerBeforePart(part: Part, layersToIgnore: Set<string>): Piece[] {
    const indexOfPart: number = this.parts.findIndex((p) => p.id === part.id)
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
    return this.parts
      .slice(0, startIndex + 1)
      .flatMap((part) => part.getPiecesWithLifespan(lifespans))
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
    return this.parts.some((part) => part.id === piece.getPartId())
  }

  public reset(): void {
    this.removeUnplannedParts()
    this.parts.forEach(part => part.reset())
  }

  private removeUnplannedParts(): void {
    this.parts = this.parts.filter(part => part.isPlanned)
  }

  public insertPartAfterActivePart(part: Part): void {
    const activePartIndex: number = this.parts.findIndex(p => p.isOnAir())
    if (activePartIndex < 0) {
      throw new NotFoundException(`Not allowed to insert Part: ${part.id} into Segment: ${this.id} because Segment does not have the active Part.`)
    }

    part.setSegmentId(this.id)

    const isActivePartLastPartInSegment: boolean = activePartIndex + 1 === this.parts.length
    if (isActivePartLastPartInSegment) {
      this.parts.push(part)
      return
    }

    const isPartAfterActivePartAnUnplannedPart: boolean = !this.parts[activePartIndex + 1].isPlanned
    if (isPartAfterActivePartAnUnplannedPart) {
      this.parts[activePartIndex + 1] = part
      return
    }

    this.parts.splice(activePartIndex + 1, 0, part)
  }

  public getUnsyncedCopy(): Segment {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, { id: `${this.id}${UNSYNCED_ID_POSTFIX}`})
  }

  public getIsSegmentUntimed(): boolean {
    return !this.getParts().some(part => !part.isUntimed())
  }
}
