import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

// These values are taken from TSR TODO: Find a better way for types.
export interface AtemMeTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.ME
    me: {
      input: number
      transition: AtemTransition
    }
  }
}

export interface AtemAuxTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.AUX,
    aux: {
      input: number
    }
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

export enum AtemTransition {
  MIX = 0,
  DIP = 1,
  WIPE = 2,
  DVE = 3,
  STING = 4,
  CUT = 5,
  DUMMY = 6
}