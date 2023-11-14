import { Tv2SourceMappingWithSound } from './tv2-studio-blueprint-configuration'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2AudioMode } from '../enums/tv2-audio-mode'

export type Tv2ActionManifestData = Tv2ActionManifestDataForVideoClip | Tv2ActionManifestDataForSplitScreen
/**
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database when dealing with Video Clips.
 * The attributes need to match the attributes in the database
 */
export interface Tv2ActionManifestDataForVideoClip {
  adLibPix: boolean
  voLevels: boolean
  duration: number
  partDefinition: {
    storyName: string
    fields: {
      videoId: string
    }
  }
}

/**
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database when dealing with split screens.
 * The attributes need to match the attributes in the database.
 */
export interface Tv2ActionManifestDataForSplitScreen {
  name: string
  pieceType: Tv2PieceType
  config: {
    template: string,
    sources: {
      [SplitScreenBoxInput.INPUT_1]?: Tv2ActionManifestSplitScreenSource,
      [SplitScreenBoxInput.INPUT_2]?: Tv2ActionManifestSplitScreenSource,
      [SplitScreenBoxInput.INPUT_3]?: Tv2ActionManifestSplitScreenSource,
      [SplitScreenBoxInput.INPUT_4]?: Tv2ActionManifestSplitScreenSource,
    }
  }
}

export enum SplitScreenBoxInput {
  INPUT_1 = 'INP1',
  INPUT_2 = 'INP2',
  INPUT_3 = 'INP3',
  INPUT_4 = 'INP4'
}

export interface Tv2ActionManifestSplitScreenSource {
  sourceType: TvActionManifestSplitScreenSourceType,
  id: string,
  name: string
}

export enum TvActionManifestSplitScreenSourceType {
  CAMERA = 'KAM',
  LIVE = 'REMOTE'
}

export interface Tv2VideoClipManifestData {
  name: string // userData.partDefinition.storyName
  fileName: string // userData.partDefinition.videoId
  durationFromIngest: number // userData.duration
  adLibPix: boolean // userData.adLibPix // What does "adLibPix" mean?
  audioMode: Tv2AudioMode // userData.voLevels
}

export interface Tv2SplitScreenManifestData {
  name: string,
  template: string,
  sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound>
}
