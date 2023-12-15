import {Piece} from '../../model/entities/piece'
import {PieceAvailabilityStatus} from '../../model/enums/piece-availability-status'

export class PieceDto {
  public readonly id: string
  public readonly partId: string
  public readonly name: string
  public readonly start: number
  public readonly duration?: number
  public readonly layer: string
  public readonly isPlanned: boolean
  public readonly metadata?: unknown
  public readonly availabilityStatus?: PieceAvailabilityStatus

  constructor(piece: Piece) {
    this.id = piece.id
    this.partId = piece.getPartId()
    this.name = piece.name
    this.start = piece.getStart()
    this.duration = piece.getDuration()
    this.layer = piece.layer
    this.isPlanned = piece.isPlanned
    this.metadata = piece.metadata
    this.availabilityStatus = piece.getAvailabilityStatus()
  }
}
