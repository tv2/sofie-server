import { Tv2MediaPlayer } from './tv2-studio-blueprint-configuration'

// These values are taken from "TimelinePersistentStateExt" in Blueprints
export interface Tv2RundownPersistentState {
  activeMediaPlayerSessions: Tv2MediaPlayerSession[]
  isNewSegment: boolean
}

export interface Tv2MediaPlayerSession {
  sessionId: string // Hardcoded ID from Blueprints
  mediaPlayer: Tv2MediaPlayer
}
