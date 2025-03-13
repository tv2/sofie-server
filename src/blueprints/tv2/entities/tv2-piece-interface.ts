import { PieceInterface } from '../../../model/entities/piece'
import { PieceMetadata } from '../../../model/value-objects/metadata'

export interface Tv2PieceInterface extends PieceInterface {
  metadata: PieceMetadata
}
