import { PieceInterface } from '../../../model/entities/piece'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'

export interface Tv2Piece extends PieceInterface {
  metadata: Tv2PieceMetadata
}
