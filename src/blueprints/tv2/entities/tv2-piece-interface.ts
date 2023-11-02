import { PieceInterface } from '../../../model/entities/piece'
import { Tv2PieceMetadata } from '../value-objects/tv2-metadata'

export interface Tv2PieceInterface extends PieceInterface {
  metadata: Tv2PieceMetadata
}
