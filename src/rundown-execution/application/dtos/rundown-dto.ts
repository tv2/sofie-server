import { SegmentDto } from './segment-dto'
import { Rundown } from '../../domain/entities/rundown'
import { PieceDto } from './piece-dto'
import { RundownTiming } from '../../domain/value-objects/rundown-timing'
import { RundownMode } from '../../domain/enums/rundown-mode'
import { TakeMode } from '../../domain/enums/take-mode'

export class RundownDto {
  public readonly id: string
  public readonly name: string
  public readonly mode: RundownMode
  public readonly takeMode: TakeMode
  public readonly modifiedAt: number
  public readonly infinitePieces: PieceDto[]
  public readonly segments: SegmentDto[]
  public readonly timing: RundownTiming

  constructor(rundown: Rundown) {
    this.id = rundown.id
    this.name = rundown.name
    this.mode = rundown.getMode()
    this.takeMode = rundown.getTakeMode()
    this.modifiedAt = rundown.getLastTimeModified()
    this.infinitePieces = rundown.getInfinitePieces().map((piece) => new PieceDto(piece))
    this.segments = rundown.getSegments().map((segment) => new SegmentDto(segment))
    this.timing = rundown.timing
  }
}
