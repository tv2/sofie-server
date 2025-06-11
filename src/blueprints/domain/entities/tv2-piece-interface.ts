import { PieceInterface } from '../../../rundown-execution/domain/entities/piece'
import { PieceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

export interface Tv2PieceInterface extends PieceInterface {
  metadata: PieceMetadata
}
