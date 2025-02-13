import { PieceInterface } from '../../../model/entities/piece'
import { Tv2PieceMetadata } from '../value-objects/tv2-blueprint-timeline-object'

export interface Tv2PieceInterface extends PieceInterface {
  metadata: Tv2PieceMetadata
}
