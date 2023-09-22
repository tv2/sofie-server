import { DeviceType } from '../../model/enums/device-type'

// These values are taken from TSR TODO: Find a better way for types.
export interface AtemTimelineObjectContent {
  deviceType: DeviceType.ATEM,
  type: AtemType,
  me?: {
    input?: number,
    previewInput?: number
  },
  aux?: {
    input: number
  }
}

// Taken from TSR, so we must have the same values. // TODO: Find a better way to get the types from TSR
export enum AtemType {
  ME = 'me',
  DSK = 'dsk',
  AUX = 'aux',
  SSRC = 'ssrc',
  SSRC_PROPS = 'ssrcProps',
  MEDIA_PLAYER = 'mp',
  AUDIO_CHANNEL = 'audioChan',
  MACRO_PLAYER = 'macroPlayer',
}
