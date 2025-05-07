import { PartAction, PieceAction } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Breaker, TransitionEffectType } from './tv2-show-style-blueprint-configuration'
import { Tv2DownstreamKeyer } from './tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from './tv2-blueprint-timeline-object'
import { AudioMode } from '../../../model/enums/audio-mode'
import {
  AudioPlayoutContent,
  CameraPlayoutContent, GraphicsPlayoutContent,
  PlayoutContent, RemotePlayoutContent, ReplayPlayoutContent, RobotPlayoutContent, SourcePlayoutContent,
  SplitScreenPlayoutContent, TransitionPlayoutContent,
  VideoPlayoutContent
} from '../../../model/value-objects/playout-content'
import { PlayoutContentType } from '../../../model/enums/playout-content-type'

export enum Tv2ActionSubtype {
  RECALL_SPLIT_SCREEN = 'RECALL_SPLIT_SCREEN',
  SPLIT_SCREEN_LAYOUT = 'SPLIT_SCREEN_LAYOUT',
  SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT = 'SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT',
  SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT = 'SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT',
  RECALL_LAST_PLANNED_REMOTE = 'RECALL_LAST_PLANNED_REMOTE',
  FADE_AUDIO_BED = 'FADE_AUDIO_BED',
  CALL_PRESET = 'CALL_PRESET',
  GRAPHICS_THEME_OUT = 'GRAPHICS_THEME_OUT',
  GRAPHICS_CLEAR = 'GRAPHICS_CLEAR',
  GRAPHICS_ALL_OUT = 'GRAPHICS_ALL_OUT'
}

export type Tv2Action = Tv2PartAction | Tv2PieceAction

export interface Tv2PartAction extends PartAction {
  metadata: {
    playoutContent: PlayoutContent
    actionSubtype?: Tv2ActionSubtype
  }
}

export interface Tv2PieceAction extends PieceAction {
  metadata: {
    playoutContent: PlayoutContent
    actionSubtype?: Tv2ActionSubtype
  }
}

export interface Tv2VideoClipAction extends Tv2PartAction {
  metadata: {
    playoutContent: VideoPlayoutContent
    fileName: string
    configuredVideoClipPostRollDuration: number
  }
}

export interface Tv2CameraAction extends Tv2PartAction {
  metadata: {
    playoutContent: CameraPlayoutContent
  }
}

export interface Tv2RemoteAction extends Tv2PartAction {
  metadata: {
    playoutContent: RemotePlayoutContent
  }
}

export interface Tv2RecallLastPlannedRemoteAsNextAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT,
  metadata: {
    playoutContent: RemotePlayoutContent
    actionSubtype: Tv2ActionSubtype.RECALL_LAST_PLANNED_REMOTE,
  }
}

export interface Tv2TransitionEffectAction extends Tv2PieceAction {
  metadata: Tv2TransitionEffectActionMetadata
}

export type Tv2TransitionEffectActionMetadata = Tv2CutTransitionEffectActionMetadata | Tv2MixTransitionEffectActionMetadata | Tv2DipTransitionEffectActionMetadata | Tv2BreakerTransitionEffectActionMetadata

export interface Tv2CutTransitionEffectActionMetadata {
  playoutContent: TransitionPlayoutContent
  transitionEffectType: TransitionEffectType.CUT
}

export interface Tv2MixTransitionEffectActionMetadata {
  playoutContent: TransitionPlayoutContent
  transitionEffectType: TransitionEffectType.MIX
  durationInFrames: number
}

export interface Tv2DipTransitionEffectActionMetadata {
  playoutContent: TransitionPlayoutContent
  transitionEffectType: TransitionEffectType.DIP
  durationInFrames: number,
  dipInput: number
}

export interface Tv2BreakerTransitionEffectActionMetadata {
  playoutContent: TransitionPlayoutContent
  transitionEffectType: TransitionEffectType.BREAKER
  casparCgPreRollDuration: number
  downstreamKeyer: Tv2DownstreamKeyer
  breakerFolder: string
  breaker: Breaker
}

export interface Tv2AudioAction extends Tv2PieceAction {
  metadata: {
    playoutContent: AudioPlayoutContent
  }
}

export interface Tv2FadeAudioBedAction extends Tv2PieceAction {
  metadata: {
    playoutContent:AudioPlayoutContent
    actionSubtype: Tv2ActionSubtype.FADE_AUDIO_BED,
    defaultFadeDurationInFrames: number
  }
}

export interface Tv2SplitScreenAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    playoutContent: SplitScreenPlayoutContent
  }
}

export interface Tv2RecallSplitScreenAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    playoutContent: SplitScreenPlayoutContent
    actionSubtype: Tv2ActionSubtype.RECALL_SPLIT_SCREEN,
  }
}

export interface Tv2SplitScreenLayoutAction extends Tv2PartAction {
  type: PartActionType.INSERT_PART_AS_NEXT
  metadata: {
    playoutContent: SplitScreenPlayoutContent
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_LAYOUT,
  }
}

export interface Tv2SplitScreenInsertSourceInputAction extends Tv2PieceAction {
  type: PieceActionType.REPLACE_PIECE
  metadata: {
    playoutContent: SplitScreenPlayoutContent
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT
    insertedContentType: PlayoutContentType
  } & Tv2SplitScreenInsertSourceInputMetadata
}

export type Tv2SplitScreenInsertSourceInputMetadata = {
  inputIndex: number // zero-indexed
  videoMixerSource: number,
  sourcePlayoutContent: SourcePlayoutContent
  audioTimelineObjects: Tv2BlueprintTimelineObject[]
  videoClip?: {
    timelineObjects: Tv2BlueprintTimelineObject[]
    mediaPlayerSession: string
    audioMode: AudioMode
  }
}

export interface Tv2SplitScreenInsertLastVideoClipInputAction extends Tv2PieceAction {
  type: PieceActionType.REPLACE_PIECE
  metadata: {
    playoutContent: SplitScreenPlayoutContent
    actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_LAST_VIDEO_CLIP_TO_INPUT
  } & Tv2SplitScreenInsertSourceInputMetadata
}

export interface Tv2ReplayAction extends Tv2PartAction {
  metadata: {
    playoutContent: ReplayPlayoutContent
  }
}

export interface Tv2ReplayAuxAction extends Tv2PieceAction {
  metadata: {
    playoutContent: ReplayPlayoutContent
  }
}

export interface Tv2RobotAction extends Tv2PieceAction {
  metadata: {
    playoutContent: RobotPlayoutContent
    actionSubtype: Tv2ActionSubtype.CALL_PRESET
  }
}

export interface Tv2FullscreenGraphicsAction extends Tv2PartAction {
  metadata: {
    playoutContent: GraphicsPlayoutContent
    sourceName: string
  }
}
