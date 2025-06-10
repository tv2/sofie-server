import { Piece } from '../../../model/entities/piece'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'

export class PieceDto {
  public readonly id: string
  public readonly partId: string
  public readonly rundownId: string
  public readonly name: string
  public readonly start: number
  public readonly duration?: number
  public readonly executedAt: number
  public readonly takenOffAirTimestamp: number
  public readonly layer: string
  public readonly isPlanned: boolean
  public readonly createdFromActionId?: string
  public readonly lifespan: PieceLifespan
  public readonly metadata?: unknown

  constructor(piece: Piece) {
    this.id = piece.id
    this.partId = piece.getPartId()
    this.rundownId = piece.rundownId
    this.name = piece.name
    this.start = piece.getStart()
    this.duration = piece.getExpectedDuration()
    this.executedAt = piece.getExecutedAt()
    this.takenOffAirTimestamp = piece.getTakenOffAirTimestamp()
    this.layer = piece.layer
    this.isPlanned = piece.isPlanned
    this.createdFromActionId = piece.createdFromActionId
    this.lifespan = piece.pieceLifespan
    this.metadata = piece.metadata
  }
}
