import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

export interface TriCasterMixEffectTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.TRICASTER
    type: TriCasterType.ME,
    me: TriCasterMixEffectProgramContent | TriCasterMixEffectDownstreamKeyerContent | TriCasterMixEffectEffectModeContent
    /**
     * Priority used to sort commands that are supposed to execute at the same time
     * Lower means faster execution (analogous to other device integrations)
     * Default: 0
     */
    temporalPriority?: number
  }
}

export interface TriCasterMixEffectProgramContent {
  type: TriCasterMixEffectContentType.PROGRAM
  programInput: string,
  transitionEffect: TriCasterTransition
  // Duration in seconds. Applicable to other effects than 'cut'
  transitionDuration?: number
}

export enum TriCasterMixEffectContentType {
  PROGRAM = 'PROGRAM',
  DOWNSTREAM_KEYER = 'DOWNSTREAM_KEYER',
  EFFECT_MODE = 'EFFECT_MODE'
}

export interface TriCasterMixEffectDownstreamKeyerContent {
  type: TriCasterMixEffectContentType.DOWNSTREAM_KEYER
  keyers: Record<TriCasterKeyerName, TriCasterKeyer>
}

export interface TriCasterMixEffectEffectModeContent {
  type: TriCasterMixEffectContentType.EFFECT_MODE
  layers: Partial<Record<TriCasterLayerName, TriCasterLayer>>
  transitionEffect: TriCasterTransition
}

/**
 * Output usually referred to as Video Mix Output
 */
export interface TriCasterMixOutputTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.TRICASTER,
    type: TriCasterType.MIX_OUTPUT,
    source: TriCasterMixOutputSource
  }
}

/**
 * Output from the Internal Matrix Router (crosspoint)
 */
export interface TriCasterMatrixOutputTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.TRICASTER,
    type: TriCasterType.MATRIX_OUTPUT,
    source: TriCasterMatrixOutputSource
  }
}

export enum TriCasterType {
  ME = 'ME',
  DSK = 'DSK',
  INPUT = 'INPUT',
  AUDIO_CHANNEL = 'AUDIO_CHANNEL',
  MIX_OUTPUT = 'MIX_OUTPUT',
  MATRIX_OUTPUT = 'MATRIX_OUTPUT'
}

/**
 * In the TriCaster there are 9 different transition presets.
 * 1. Is always Cut
 * 2. Is always Fade
 * 3 - 9 Is configurable to a plethora of different transitions.
 * This means that this Enum might not be consistent with what the TriCaster does.
 * It all depends on the configuration of the TriCaster being used.
 */
export enum TriCasterTransition {
  CUT = 'cut',
  FADE = 'fade',
  // The values below are assumptions about the TriCaster session.
  DIP = 2,
  WIPE = 3,
  WIPE_FOR_GFX = 4,
  STING = 5,
  SPLIT_SCREEN = 7 // This number is used by old Blueprints to generate split screen boxes, hence it is here.
}

/**
 * Properties of a layer in effect mode (as opposed to transition mode)
 * Value ranges in this type adhere to the API and may differ from the GUI
 */
export interface TriCasterLayer {
  input?: string;
  /**
   * Enables position, scale, rotation, crop and feather, but it's weird,
   * so setting it to false while any of said properties are defined may
   * lead to unwanted behaviour
   */
  positioningAndCropEnabled?: boolean;
  position?: {
    /**
     * Horizontal translation
     * Default: 0.0 (center)
     * Frame width: 3.555... (-3.555 is fully off-screen to the left at scale=1.0)
     */
    x: number;
    /**
     * Vertical translation
     * Default: 0.0 (center)
     * Frame height: 2.0 (-2.0 is fully off-screen to the top at scale=1.0)
     */
    y: number;
  };
  scale?: {
    /**
     * Horizontal scale factor
     * Default: 1.0; Range: 0.0 to 5.0
     */
    x: number;
    /**
     * Vertical scale factor
     * Default: 1.0; Range: 0.0 to 5.0
     */
    y: number;
  };
  rotation?: {
    /**
     * X-axis rotation (degrees)
     * Default: 0.0; Range: -1440.0 to 1440.0
     */
    x: number;
    /**
     * Y-axis rotation (degrees)
     * Default: 0.0; Range: -1440.0 to 1440.0
     */
    y: number;
    /**
     * Z-axis rotation (perpendicular to screen plane) (degrees)
     * Default: 0.0; Range: -1440.0 to 1440.0
     */
    z: number;
  };
  crop?: {
    /**
     * Crop left (percentage)
     * Default: 0.0 (center); Range: 0.0 to 100.0
     */
    left: number;
    /**
     * Crop right (percentage)
     * Default: 0.0 (center); Range: 0.0 to 100.0
     */
    right: number;
    /**
     * Crop up (from the top, hence called "Bottom" in the UI) (percentage)
     * Default: 0.0 (center); Range: 0.0 to 100.0
     */
    up: number;
    /**
     * Crop down (from the top, hence called "Top" in the UI) (percentage)
     * Default: 0.0 (center); Range: 0.0 to 100.0
     */
    down: number;
  };
  /**
   * Border feather (percentage)
   * Default: 0.0; Range: 0.0 to 100.0
   */
  feather?: number;
}

export interface TriCasterKeyer {
  input: string
  onAir: boolean
}

export type TriCasterMixEffectName = 'main' | `v${number}`;
export type TriCasterKeyerName = `dsk${number}`;
export type TriCasterInputName = `input${number}`;
export type TriCasterSourceName = TriCasterInputName | `ddr${number}` | `bfr${number}` | 'black';
export type TriCasterMixOutputSource = TriCasterSourceName | TriCasterMixEffectName | 'program' | 'preview' | 'program_clean' | 'me_program' | 'me_preview';
export type TriCasterMixOutputName = `mix${number}`;
export type TriCasterMatrixOutputSource = TriCasterSourceName | TriCasterMixOutputName;
export type TriCasterLayerName = 'a' | 'b' | 'c' | 'd'


export enum TriCasterSourceIndex {
  BLACK = 'black',
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
  V4 = 'v4',
  BFR1 = 'bfr1',
  BFR2 = 'bfr2'
}
