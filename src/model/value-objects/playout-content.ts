import { PlayoutContentType } from '../enums/playout-content-type'

export type PlayoutContent =
  | SourcePlayoutContent
  | SplitScreenPlayoutContent
  | SplitScreenInputPlayoutContent
  | GraphicsPlayoutContent
  | OverlayGraphicsPlayoutContent
  | VideoPlayoutContent
  | VoiceOverPlayoutContent
  | JinglePlayoutContent
  | AudioPlayoutContent
  | ManusPlayoutContent
  | TransitionPlayoutContent
  | CommandPlayoutContent
  | RobotPlayoutContent
  | RecalledPlayoutContent<PlayoutContentType>
  | UnknownPlayoutContent

export type SourcePlayoutContent = CameraPlayoutContent | RemotePlayoutContent | ReplayPlayoutContent | UnknownPlayoutContent

export interface CameraPlayoutContent {
  type: PlayoutContentType.CAMERA
  source: string
}

export interface RemotePlayoutContent {
  type: PlayoutContentType.REMOTE
  source: string
}

export interface ReplayPlayoutContent {
  type: PlayoutContentType.REPLAY
  source: string
}

export interface SplitScreenPlayoutContent {
  type: PlayoutContentType.SPLIT_SCREEN
  layout: string
  inputPlayoutContents: Record<number, SplitScreenInputPlayoutContent>
}

export interface SplitScreenInputPlayoutContent {
  type: PlayoutContentType.SPLIT_SCREEN_INPUT
  inputIndex: number // zero-indexed
  sourcePlayoutContent: SourcePlayoutContent
}

export interface GraphicsPlayoutContent {
  type: PlayoutContentType.GRAPHICS
}

export interface OverlayGraphicsPlayoutContent {
  type: PlayoutContentType.OVERLAY_GRAPHICS
}

export interface VideoPlayoutContent {
  type: PlayoutContentType.VIDEO_CLIP
}

export interface VoiceOverPlayoutContent {
  type: PlayoutContentType.VOICE_OVER
}

export interface JinglePlayoutContent {
  type: PlayoutContentType.JINGLE
}

export interface AudioPlayoutContent {
  type: PlayoutContentType.AUDIO
}

export interface ManusPlayoutContent {
  type: PlayoutContentType.MANUS
}

export interface TransitionPlayoutContent {
  type: PlayoutContentType.TRANSITION
}

export interface CommandPlayoutContent {
  type: PlayoutContentType.COMMAND
}

export interface RobotPlayoutContent {
  type: PlayoutContentType.ROBOT
}

export interface RecalledPlayoutContent<RecalledType extends PlayoutContentType> {
  type: PlayoutContentType.RECALLED
  recalledType: RecalledType
}

export interface UnknownPlayoutContent {
  type: PlayoutContentType.UNKNOWN
}
