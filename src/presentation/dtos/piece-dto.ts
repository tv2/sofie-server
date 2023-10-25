import { Piece } from '../../model/entities/piece'

export class PieceDto {
  public readonly id: string
  public readonly partId: string
  public readonly name: string
  public readonly start: number
  public readonly duration: number
  public readonly layer: string
  public readonly outputLayer: string
  public readonly isPlanned: boolean

  constructor(piece: Piece) {
    this.id = piece.id
    this.partId = piece.getPartId()
    this.name = piece.name
    this.start = piece.getStart()
    this.duration = piece.duration
    this.layer = piece.layer
    this.outputLayer = piece.outputLayer
    this.isPlanned = piece.isPlanned
  }
}
