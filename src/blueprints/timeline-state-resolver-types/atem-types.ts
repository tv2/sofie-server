import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

// These values are taken from TSR TODO: Find a better way for types.
export interface AtemMeTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.ME
    me: {
      input?: number
      transition?: AtemTransition,
      transitionSettings?: AtemTransitionSettings
      upstreamKeyers?: AtemUpstreamKeyer[]
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

export interface AtemDownstreamKeyerTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.DSK,
    dsk: {
      onAir: boolean,
      sources: {
        fillSource: number,
        cutSource: number
      },
      properties: {
        clip: number,
        gain: number,
        mask: {
          enable: boolean
        }
      }
    }
  }
}

export interface AtemUpstreamKeyer {
  upstreamKeyerId: number,
  onAir: boolean,
  mixEffectKeyType: number,
  flyEnabled: boolean,
  fillSource: number,
  cutSource: number,
  maskEnabled: boolean,
  lumaSettings: {
    clip: number,
    gain: number,
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

export interface AtemTransitionSettings {
  mix?: {
    rate: number
  }
  dip?: {
    rate: number,
    input: number
  },
  wipe?: {
    /** 1 - 250 frames */
    rate?: number;
    /** 0 - 17 */
    pattern?: number;
    /** 0 - 10000 */
    borderSoftness?: number;
    reverseDirection?: boolean;
    //...
  }
}