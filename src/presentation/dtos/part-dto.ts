import { Part } from '../../model/entities/part'
import { PieceDto } from './piece-dto'
import { AutoNext } from '../../model/value-objects/auto-next'

export class PartDto {
  public readonly id: string
  public readonly segmentId: string
  public readonly name: string
  public readonly isOnAir: boolean
  public readonly isNext: boolean
  public readonly isUnsynced: boolean
  public readonly expectedDuration?: number
  public readonly executedAt: number
  public readonly playedDuration: number
  public readonly autoNext?: AutoNext
  public readonly isPlanned: boolean
  public readonly pieces: PieceDto[]

  constructor(part: Part) {
    this.id = part.id
    this.segmentId = part.getSegmentId()
    this.name = part.name
    this.isOnAir = part.isOnAir()
    this.isNext = part.isNext()
    this.isUnsynced = part.isUnsynced()
    this.expectedDuration = part.expectedDuration
    this.executedAt = part.getExecutedAt()
    this.playedDuration = part.getPlayedDuration()
    this.autoNext = part.autoNext
    this.isPlanned = part.isPlanned
    this.pieces = part.getPieces().map((piece) => new PieceDto(piece))
  }
}
