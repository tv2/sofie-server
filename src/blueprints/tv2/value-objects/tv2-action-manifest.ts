import { ActionManifest } from '../../../model/entities/action'
import { PieceType } from '../../../model/enums/piece-type'

export interface Tv2GraphicsActionManifest extends ActionManifest {
  pieceType: PieceType.GRAPHIC
  userData: {
    name: string,
    vcpid: number
  }
}