import { Tv2PieceType } from '../enums/tv2-piece-type'

export interface Tv2VideoClipData {
  name: string // userData.partDefinition.storyName
  fileName: string // userData.partDefinition.videoId
  durationFromIngest: number // userData.duration
  adLibPix: boolean // userData.adLibPix // What does "adLibPix" mean?
  isVoiceOver: boolean // userData.voLevels
}

/**
 * This corresponds to the 'userData' field on the 'adLibActions' collection in the database
 * The attributes need to match the attributes in the database
 */
export interface Tv2ActionManifestData {
  pieceType: Tv2PieceType
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
