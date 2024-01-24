import { SegmentDto } from './segment-dto'
import { Rundown } from '../../model/entities/rundown'
import { PieceDto } from './piece-dto'
import { RundownTiming } from '../../model/value-objects/rundown-timing'

export class RundownDto {
  public readonly id: string
  public readonly name: string
  public readonly isActive: boolean
  public readonly modifiedAt: number
  public readonly infinitePieces: PieceDto[]
  public readonly segments: SegmentDto[]
  public readonly timing: RundownTiming

  constructor(rundown: Rundown) {
    this.id = rundown.id
    this.name = rundown.name
    this.isActive = rundown.isActive() ?? false
    this.modifiedAt = rundown.getLastTimeModified()
    this.infinitePieces = rundown.getInfinitePieces().map((piece) => new PieceDto(piece))
    this.segments = rundown.getSegments().map((segment) => new SegmentDto(segment))
    this.timing = rundown.timing
  }
}
