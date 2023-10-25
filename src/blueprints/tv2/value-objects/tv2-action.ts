import { PartAction, PieceAction } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'

export enum Tv2ActionContentType {
  CAMERA = 'CAMERA',
  VIDEO_CLIP = 'VIDEO_CLIP',
  TRANSITION = 'TRANSITION',
  GRAPHICS = 'GRAPHICS',
  AUDIO = 'AUDIO',
  DVE_LAYOUT = 'DVE_LAYOUT',
  DVE_INSERT_SOURCE_TO_INPUT = 'DVE_INSERT_SOURCE_TO_INPUT',
  UNKNOWN = 'UNKNOWN'
}

export interface Tv2PartAction extends PartAction {
  metadata: {
    contentType: Tv2ActionContentType
  }
}

export interface Tv2PieceAction extends PieceAction {
  metadata: {
    contentType: Tv2ActionContentType
  }
}

export interface Tv2VideoClipAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.VIDEO_CLIP,
    fileName: string
    configuredVideoClipPostrollDuration: number
  }
}

export interface Tv2CameraAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.CAMERA,
    cameraNumber: string
  }
}

export interface Tv2TransitionAction extends Tv2PieceAction {
  metadata: {
    contentType: Tv2ActionContentType.TRANSITION,
  }
}

export interface Tv2AudioAction extends Tv2PieceAction {
  metadata: {
    contentType: Tv2ActionContentType.AUDIO,
  }
}

export interface Tv2DveLayoutAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    contentType: Tv2ActionContentType.DVE_LAYOUT
  }
}

export interface Tv2DveInsertSourceInputAction extends Tv2PieceAction {
  type: PieceActionType.TRY_INSERT_PIECE_AS_ON_AIR_THEN_AS_NEXT
  metadata: {
    contentType: Tv2ActionContentType.DVE_INSERT_SOURCE_TO_INPUT,
    inputIndex: number // zero-indexed
    videoMixerSource: number
  }
}
