import { Piece } from '../../model/entities/piece'
import { PieceLifespan } from '../../model/enums/piece-lifespan'

export class PieceDto {
  public readonly id: string
  public readonly partId: string
  public readonly name: string
  public readonly start: number
  public readonly duration?: number
  public readonly layer: string
  public readonly isPlanned: boolean
  public readonly lifespan: PieceLifespan
  public readonly metadata?: unknown

  constructor(piece: Piece) {
    this.id = piece.id
    this.partId = piece.getPartId()
    this.name = piece.name
    this.start = piece.getStart()
    this.duration = piece.getDuration()
    this.layer = piece.layer
    this.isPlanned = piece.isPlanned
    this.lifespan = piece.pieceLifespan
    this.metadata = piece.metadata
  }
}
