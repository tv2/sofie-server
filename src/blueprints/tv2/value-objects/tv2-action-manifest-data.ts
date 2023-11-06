import { Tv2SourceLayer } from './tv2-layers'

/**
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database
 * The attributes need to match the attributes in the database
 */
export interface Tv2ActionManifestData {
  name: string
  vcpid: number
  expectedDuration?: number
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

export interface Tv2VideoClipData {
  name: string // userData.partDefinition.storyName
  fileName: string // userData.partDefinition.videoId
  durationFromIngest: number // userData.duration
  adLibPix: boolean // userData.adLibPix // What does "adLibPix" mean?
  isVoiceOver: boolean // userData.voLevels
}

export interface Tv2GraphicsData {
  pieceLayer?: Tv2SourceLayer
  name: string,
  vcpId?: number
  expectedDuration?: number
}