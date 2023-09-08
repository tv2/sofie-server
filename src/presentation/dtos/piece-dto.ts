import { Piece } from '../../model/entities/piece'

export class PieceDto {
  public readonly id: string
  public readonly partId: string
  public readonly name: string
  public readonly start: number
  public readonly duration: number
  public readonly layer: string

  constructor(piece: Piece) {
    this.id = piece.id
    this.partId = piece.partId
    this.name = piece.name
    this.start = piece.start
    this.duration = piece.duration
    this.layer = piece.layer
  }
}
