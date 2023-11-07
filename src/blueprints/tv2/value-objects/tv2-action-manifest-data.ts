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

export enum Tv2GraphicsDataType {
  IDENT = 'IDENT',
  LOWER_THIRD = 'LOWER_THIRD',
  FULL = 'FULL'
}

export interface Tv2GraphicsData {
  type: Tv2GraphicsDataType
  name: string,
  vcpId?: number
  expectedDuration?: number
}