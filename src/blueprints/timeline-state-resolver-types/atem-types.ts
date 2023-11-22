import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

export interface AtemMeTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.ME
    me: {
      input: number
      transition: AtemTransition,
      transitionSettings?: AtemTransitionSettings
    }
  }
}

export interface AtemMeUpstreamKeyersTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.ME
    me: {
      upstreamKeyers: AtemUpstreamKeyer[]
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

export interface AtemSuperSourceTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.SUPER_SOURCE,
    ssrc: {
      boxes: AtemSuperSourceBox[]
    }
  }
}

export type AtemSuperSourceBox = {
  enabled?: boolean;
  source?: number;
  /** -4800 - 4800 */
  x?: number;
  /** -2700 - 2700 */
  y?: number;
  /** 70 - 1000 */
  size?: number;
  cropped?: boolean;
  /** 0 - 18000 */
  cropTop?: number;
  /** 0 - 18000 */
  cropBottom?: number;
  /** 0 - 32000 */
  cropLeft?: number;
  /** 0 - 32000 */
  cropRight?: number;
}

export interface AtemSuperSourcePropertiesTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.ATEM,
    type: AtemType.SUPER_SOURCE_PROPERTIES,
    ssrcProps: {
      artFillSource: number,
      artCutSource: number,
      artOption: number
    } & SuperSourceProperties & SuperSourceBorder
  }
}

export type SuperSourceProperties = {
  /** Premultiply key for Art Source */
  artPreMultiplied: true;
} | {
  /** Premultiply key for Art Source */
  artPreMultiplied: false
  /** Linear keyer Clip value for Art Source, 0-1000 */
  artClip: number
  /** Linear keyer Gain value for Art Source, 0-1000  */
  artGain: number
  /** Invert keyer Key input */
  artInvertKey: boolean
}

export type SuperSourceBorder = {
  borderEnabled: false
} | {
  borderEnabled: true,
  /** Border Bevel mode:
   *  0: no bevel, 1: in/out, 2: in, 3: out
   */
  borderBevel: number;
  /** Width of the outer side of the bevel, 0-1600 */
  borderOuterWidth: number;
  /** Width of the inner side of the bevel, 0-1600 */
  borderInnerWidth: number;
  /** Softness of the outer side of the bevel, 0-100 */
  borderOuterSoftness: number;
  /** Softness of the inner side of the bevel, 0-100 */
  borderInnerSoftness: number;
  /** Softness of the bevel, 0-100 */
  borderBevelSoftness: number;
  /** Position of the bevel, 0-100 */
  borderBevelPosition: number;
  /** Hue of the border color, 0-3599 */
  borderHue: number;
  /** Saturation of the border color, 0-1000 */
  borderSaturation: number;
  /** Luminance of the border color, 0-1000 */
  borderLuma: number;
  /** Light source direction for rendering the bevel, 0-3590 */
  borderLightSourceDirection: number;
  /** Light source altitude for rendering the bevel, 10-100 */
  borderLightSourceAltitude: number;
}

// Taken from TSR, so we must have the same values. // TODO: Find a better way to get the types from TSR
export enum AtemType {
  ME = 'me',
  DSK = 'dsk',
  AUX = 'aux',
  SUPER_SOURCE = 'ssrc',
  SUPER_SOURCE_PROPERTIES = 'ssrcProps',
  MEDIA_PLAYER = 'mp',
  AUDIO_CHANNEL = 'audioChan',
  MACRO_PLAYER = 'macroPlayer',
}

export enum AtemTransition {
  MIX = 0,
  DIP = 1,
  WIPE = 2,
  SPLIT_SCREEN = 3,
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
    pattern?: AtemMeWipePattern;
    /** 0 - 10000 */
    borderSoftness?: number;
    reverseDirection?: boolean;
    //...
  }
}

export enum AtemMeWipePattern {
  LEFT_TO_RIGHT_BAR = 0,
  TOP_TO_BOTTOM_BAR = 1,
  HORIZONTAL_BARN_DOOR = 2,
  VERTICAL_BARN_DOOR = 3,
  CORNERS_IN_FOUR_BOX = 4,
  RECTANGLE_IRIS = 5,
  DIAMOND_IRIS = 6,
  CIRCLE_IRIS = 7,
  TOP_LEFT_BOX = 8,
  TOP_RIGHT_BOX = 9,
  BOTTOM_RIGHT_BOX = 10,
  BOTTOM_LEFT_BOX = 11,
  TOP_CENTRE_BOX = 12,
  RIGHT_CENTRE_BOX = 13,
  BOTTOM_CENTRE_BOX = 14,
  LEFT_CENTRE_BOX = 15,
  TOP_LEFT_DIAGONAL = 16,
  TOP_RIGHT_DIAGONAL = 17
}
