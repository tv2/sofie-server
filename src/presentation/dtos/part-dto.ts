import { Part } from '../../model/entities/part'
import { PieceDto } from './piece-dto'

export class PartDto {
  public readonly id: string
  public readonly segmentId: string
  public readonly name: string
  public readonly pieces: PieceDto[]
  public readonly isOnAir: boolean
  public readonly isNext: boolean
  public readonly expectedDuration: number
  public readonly executedAt?: number

  constructor(part: Part) {
    this.id = part.id
    this.segmentId = part.segmentId
    this.name = part.name
    this.pieces = part.getPieces().map((piece) => new PieceDto(piece))
    this.isOnAir = part.isOnAir()
    this.isNext = part.isNext()
    this.expectedDuration = part.expectedDuration
    this.executedAt = part.getExecutedAt()
  }
}
