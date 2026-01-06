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
  | DownstreamKeyerPlayoutContent
  | UnknownPlayoutContent

export type SourcePlayoutContent = CameraPlayoutContent | RemotePlayoutContent | ReplayPlayoutContent | UnknownPlayoutContent

export interface CameraPlayoutContent {
  readonly type: PlayoutContentType.CAMERA
  readonly source: string
}

export interface RemotePlayoutContent {
  readonly type: PlayoutContentType.REMOTE
  readonly source: string
}

export interface ReplayPlayoutContent {
  readonly type: PlayoutContentType.REPLAY
  readonly source: string
}

export interface SplitScreenPlayoutContent {
  readonly type: PlayoutContentType.SPLIT_SCREEN
  readonly layout: string
  readonly inputPlayoutContents: Record<number, SplitScreenInputPlayoutContent>
}

export interface SplitScreenInputPlayoutContent {
  readonly type: PlayoutContentType.SPLIT_SCREEN_INPUT
  readonly inputIndex: number // zero-indexed
  readonly sourcePlayoutContent: SourcePlayoutContent
}

export interface GraphicsPlayoutContent {
  readonly type: PlayoutContentType.GRAPHICS
}

export interface OverlayGraphicsPlayoutContent {
  readonly type: PlayoutContentType.OVERLAY_GRAPHICS
}

export interface VideoPlayoutContent {
  readonly type: PlayoutContentType.VIDEO_CLIP
}

export interface VoiceOverPlayoutContent {
  readonly type: PlayoutContentType.VOICE_OVER
}

export interface JinglePlayoutContent {
  readonly type: PlayoutContentType.JINGLE
}

export interface AudioPlayoutContent {
  readonly type: PlayoutContentType.AUDIO
}

export interface ManusPlayoutContent {
  readonly type: PlayoutContentType.MANUS
}

export interface TransitionPlayoutContent {
  readonly type: PlayoutContentType.TRANSITION
}

export interface CommandPlayoutContent {
  readonly type: PlayoutContentType.COMMAND
}

export interface RobotPlayoutContent {
  readonly type: PlayoutContentType.ROBOT
}

export interface RecalledPlayoutContent<RecalledType extends PlayoutContentType> {
  readonly type: PlayoutContentType.RECALLED
  readonly recalledType: RecalledType
}

export interface DownstreamKeyerPlayoutContent {
  readonly type: PlayoutContentType.DOWNSTREAM_KEYER
  readonly identifier: string
  readonly isOn: boolean
}

export interface UnknownPlayoutContent {
  readonly type: PlayoutContentType.UNKNOWN
}
