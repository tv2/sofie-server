import { Tv2SourceMappingWithSound } from './tv2-studio-blueprint-configuration'
import { Tv2PieceType } from '../enums/tv2-piece-type'
import { Tv2SourceLayer } from './tv2-layers'

export type Tv2ActionManifestData = Tv2ActionManifestDataForVideoClip | Tv2ActionManifestDataForDve | Tv2ActionManifestDataForGraphics
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
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database when dealing with DVEs.
 * The attributes need to match the attributes in the database.
 */
export interface Tv2ActionManifestDataForDve {
  name: string
  pieceType: Tv2PieceType
  config: {
    template: string,
    sources: {
      [DveBoxInput.INPUT_1]?: Tv2ActionManifestDveSource,
      [DveBoxInput.INPUT_2]?: Tv2ActionManifestDveSource,
      [DveBoxInput.INPUT_3]?: Tv2ActionManifestDveSource,
      [DveBoxInput.INPUT_4]?: Tv2ActionManifestDveSource,
    }
  }
}

export type Tv2ActionManifestDataForGraphics = Tv2ActionManifestDataForFullscreenGraphics | Tv2ActionManifestDataForOverlayGraphics

/**
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database when dealing with Fullscreen Graphics.
 * The attributes need to match the attributes in the database.
 */
export interface Tv2ActionManifestDataForFullscreenGraphics {
  vcpid: number
  name: string,
}

/**
 * This corresponds to the mapped fields from 'adLibPieces' collection in the database when dealing with Overlay Graphics.
 * The attributes need to match the attributes in the database.
 */
export interface Tv2ActionManifestDataForOverlayGraphics {
  sourceLayerId: Tv2SourceLayer
  name: string,
  expectedDuration?: number
}

export enum DveBoxInput {
  INPUT_1 = 'INP1',
  INPUT_2 = 'INP2',
  INPUT_3 = 'INP3',
  INPUT_4 = 'INP4'
}

export interface Tv2ActionManifestDveSource {
  sourceType: TvActionManifestDveSourceType,
  id: string,
  name: string
}

export enum TvActionManifestDveSourceType {
  CAMERA = 'KAM',
  LIVE = 'REMOTE'
}

export interface Tv2VideoClipManifestData {
  name: string // userData.partDefinition.storyName
  fileName: string // userData.partDefinition.videoId
  durationFromIngest: number // userData.duration
  adLibPix: boolean // userData.adLibPix // What does "adLibPix" mean?
  isVoiceOver: boolean // userData.voLevels
}

export interface Tv2DveManifestData {
  name: string,
  template: string,
  sources: Map<DveBoxInput, Tv2SourceMappingWithSound>
}

export type Tv2GraphicsManifestData = Tv2FullscreenGraphicsManifestData | Tv2OverlayGraphicsManifestData

export interface Tv2FullscreenGraphicsManifestData {
  vcpId: number
  name: string,
}

export interface Tv2OverlayGraphicsManifestData {
  sourceLayerId: Tv2SourceLayer
  name: string,
  expectedDuration?: number
}

