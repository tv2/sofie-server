import { Part } from './part'
import { LastPartInSegmentException } from '../exceptions/last-part-in-segment-exception'
import { NotFoundException } from '../exceptions/not-found-exception'
import { Piece } from './piece'
import { PieceLifespan } from '../enums/piece-lifespan'

export interface SegmentInterface {
  id: string
  rundownId: string
  name: string
  rank: number
  parts: Part[]
  isOnAir: boolean
  isNext: boolean
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
  private parts: Part[]

  constructor(segment: SegmentInterface) {
    this.id = segment.id
    this.rundownId = segment.rundownId
    this.name = segment.name
    this.rank = segment.rank
    this.isSegmentOnAir = segment.isOnAir
    this.isSegmentNext = segment.isNext
    this.budgetDuration = segment.budgetDuration
    this.setParts(segment.parts ?? [])
  }

  public findFirstPart(): Part {
    return this.parts[0]
  }

  public putOnAir(): void {
    this.isSegmentOnAir = true
  }

  public takeOffAir(): void {
    this.isSegmentOnAir = false
  }

  public isOnAir(): boolean {
    return this.isSegmentOnAir
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
      throw new LastPartInSegmentException()
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
    return partOne.rank - partTwo.rank
  }

  public addPart(part: Part): void {
    const doesPartAlreadyExistOnSegment: boolean = this.parts.some(p => p.id === part.id)
    if (doesPartAlreadyExistOnSegment) {
      console.log(`Part ${part.id} already exist on Segment ${this.id}`)
      return
    }
    this.parts.push(part)
    this.parts.sort(this.compareParts)
  }

  public removePart(partId: string): void {
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
}
