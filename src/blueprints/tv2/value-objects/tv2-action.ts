import { PartAction, PieceAction } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Breaker, TransitionEffectType } from './tv2-show-style-blueprint-configuration'
import { Tv2DownstreamKeyer } from './tv2-studio-blueprint-configuration'
import { Tv2AudioMode } from '../enums/tv2-audio-mode'

export enum Tv2ActionContentType {
  CAMERA = 'CAMERA',
  REMOTE = 'REMOTE',
  VIDEO_CLIP = 'VIDEO_CLIP',
  TRANSITION = 'TRANSITION',
  GRAPHICS = 'GRAPHICS',
  AUDIO = 'AUDIO',
  SPLIT_SCREEN = 'SPLIT_SCREEN',
  REPLAY = 'REPLAY',
  UNKNOWN = 'UNKNOWN'
}

export enum Tv2ActionSubtype {
  RECALL_SPLIT_SCREEN = 'RECALL_SPLIT_SCREEN',
  SPLIT_SCREEN_LAYOUT = 'SPLIT_SCREEN_LAYOUT',
  SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT = 'SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT',
  SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT = 'SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT',
}

export type Tv2Action = Tv2PartAction | Tv2PieceAction

export interface Tv2PartAction extends PartAction {
  metadata: {
    contentType: Tv2ActionContentType
    actionSubtype?: Tv2ActionSubtype
  }
}

export interface Tv2PieceAction extends PieceAction {
  metadata: {
    contentType: Tv2ActionContentType
    actionSubtype?: Tv2ActionSubtype
  }
}

export interface Tv2VideoClipAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.VIDEO_CLIP,
    fileName: string
    configuredVideoClipPostRollDuration: number
  }
}

export interface Tv2CameraAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.CAMERA,
    cameraNumber: string
  }
}

export interface Tv2RemoteAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.REMOTE,
    remoteNumber: string
  }
}

export interface Tv2TransitionEffectAction extends Tv2PieceAction {
  metadata: Tv2TransitionEffectActionMetadata
}

export type Tv2TransitionEffectActionMetadata = Tv2CutTransitionEffectActionMetadata | Tv2MixTransitionEffectActionMetadata | Tv2DipTransitionEffectActionMetadata | Tv2BreakerTransitionEffectActionMetadata

export interface Tv2CutTransitionEffectActionMetadata {
  contentType: Tv2ActionContentType.TRANSITION,
  transitionEffectType: TransitionEffectType.CUT
}

export interface Tv2MixTransitionEffectActionMetadata {
  contentType: Tv2ActionContentType.TRANSITION,
  transitionEffectType: TransitionEffectType.MIX
  durationInFrames: number
}

export interface Tv2DipTransitionEffectActionMetadata {
  contentType: Tv2ActionContentType.TRANSITION,
  transitionEffectType: TransitionEffectType.DIP
  durationInFrames: number,
  dipInput: number
}

export interface Tv2BreakerTransitionEffectActionMetadata {
  contentType: Tv2ActionContentType.TRANSITION,
  transitionEffectType: TransitionEffectType.BREAKER
  casparCgPreRollDuration: number
  downstreamKeyer: Tv2DownstreamKeyer
  breakerFolder: string
  breaker: Breaker
}

export interface Tv2AudioAction extends Tv2PieceAction {
  metadata: {
    contentType: Tv2ActionContentType.AUDIO,
  }
}

export interface Tv2DveAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    contentType: Tv2ActionContentType.SPLIT_SCREEN
  }
}

export interface Tv2RecallDveAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    contentType: Tv2ActionContentType.SPLIT_SCREEN,
    actionSubtype: Tv2ActionSubtype.RECALL_SPLIT_SCREEN,
  }
}

export interface Tv2DveLayoutAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    contentType: Tv2ActionContentType.SPLIT_SCREEN,
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_LAYOUT,
  }
}

export interface Tv2DveInsertSourceInputAction extends Tv2PieceAction {
  type: PieceActionType.REPLACE_PIECE
  metadata: {
    contentType: Tv2ActionContentType.SPLIT_SCREEN,
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT
  } & Tv2DveInsertSourceInputMetadata
}

export type Tv2DveInsertSourceInputMetadata = {
  inputIndex: number // zero-indexed
  videoMixerSource: number,
  audioTimelineObjects: TimelineObject[]
  videoClip?: {
    timelineObjects: TimelineObject[]
    mediaPlayerSession: string
    audioMode: Tv2AudioMode
  }
}

export interface Tv2DveInsertLastVideoClipInputAction extends Tv2PieceAction {
  type: PieceActionType.REPLACE_PIECE
  metadata: {
    contentType: Tv2ActionContentType.SPLIT_SCREEN,
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT
  } & Tv2DveInsertSourceInputMetadata
}

export interface Tv2ReplayAction extends Tv2PartAction {
  metadata: {
    contentType: Tv2ActionContentType.REPLAY
  }
}

export interface Tv2ReplayAuxAction extends Tv2PieceAction {
  metadata: {
    contentType: Tv2ActionContentType.REPLAY
  }
}
