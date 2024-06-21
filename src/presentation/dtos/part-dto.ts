import { Part, PartMetadata } from '../../model/entities/part'
import { PieceDto } from './piece-dto'
import { AutoNext } from '../../model/value-objects/auto-next'
import { Invalidity } from '../../model/value-objects/invalidity'

export class PartDto {
  public readonly id: string
  public readonly segmentId: string
  public readonly name: string
  public readonly rank: number
  public readonly isOnAir: boolean
  public readonly isNext: boolean
  public readonly isUntimed: boolean
  public readonly isUnsynced: boolean
  public readonly expectedDuration?: number
  public readonly executedAt: number
  public readonly playedDuration: number
  public readonly invalidity?: Invalidity
  public readonly autoNext?: AutoNext
  public readonly isPlanned: boolean
  public readonly metadata?: PartMetadata
  public readonly pieces: PieceDto[]

  constructor(part: Part) {
    this.id = part.id
    this.segmentId = part.getSegmentId()
    this.name = part.name
    this.rank = part.getRank()
    this.isOnAir = part.isOnAir()
    this.isNext = part.isNext()
    this.isUntimed = part.isUntimed()
    this.isUnsynced = part.isUnsynced()
    this.expectedDuration = part.expectedDuration
    this.executedAt = part.getExecutedAt()
    this.playedDuration = part.getPlayedDuration()
    this.invalidity = part.invalidity
    this.autoNext = part.autoNext
    this.isPlanned = part.isPlanned
    this.metadata = part.metadata
    this.pieces = part.getPieces().map((piece) => new PieceDto(piece))
  }
}
