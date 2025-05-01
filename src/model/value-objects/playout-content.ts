import { PlayoutContentType } from '../enums/playout-content-type'

export type PlayoutContent =
  | SourcePlayoutContent
  | SplitScreenPlayoutContent
  | GraphicsPlayoutContent
  | OverlayGraphicsPlayoutContent
  | VideoPlayoutContent
  | VoiceOverPlayoutContent
  | JinglePlayoutContent
  | AudioPlayoutContent
  | ManusPlayoutContent
  | TransitionPlayoutContent
  | CommandPlayoutContent
  | UnknownPlayoutContent

export type SourcePlayoutContent = CameraPlayoutContent | RemotePlayoutContent | ReplayPlayoutContent | UnknownPlayoutContent

interface CameraPlayoutContent {
  type: PlayoutContentType.CAMERA
  source: string
}

interface RemotePlayoutContent {
  type: PlayoutContentType.REMOTE
  source: string
}

interface ReplayPlayoutContent {
  type: PlayoutContentType.REPLAY
  source: string
}

export interface SplitScreenPlayoutContent {
  type: PlayoutContentType.SPLIT_SCREEN
  layout: string
  sources: SourcePlayoutContent[]
}

interface GraphicsPlayoutContent {
  type: PlayoutContentType.GRAPHICS
}

interface OverlayGraphicsPlayoutContent {
  type: PlayoutContentType.OVERLAY_GRAPHICS
}

interface VideoPlayoutContent {
  type: PlayoutContentType.VIDEO_CLIP
}

interface VoiceOverPlayoutContent {
  type: PlayoutContentType.VOICE_OVER
}

interface JinglePlayoutContent {
  type: PlayoutContentType.JINGLE
}

interface AudioPlayoutContent {
  type: PlayoutContentType.AUDIO
}

interface ManusPlayoutContent {
  type: PlayoutContentType.MANUS
}

interface TransitionPlayoutContent {
  type: PlayoutContentType.TRANSITION
}

interface CommandPlayoutContent {
  type: PlayoutContentType.COMMAND
}

interface UnknownPlayoutContent {
  type: PlayoutContentType.UNKNOWN
}
