export enum VideoMixerTransition {
  MIX = 'MIX',
  DIP = 'DIP',
  WIPE = 'WIPE',
  SPLIT_SCREEN = 'SPLIT_SCREEN',
  STING = 'STING',
  CUT = 'CUT',
  DUMMY = 'DUMMY'
}

export interface VideoMixerTransitionSettings {
  mix?: {
    rate: number
  }
  dip?: {
    rate: number,
    input: number
  },
  wipe?: {
    frameRate?: number;
    /** 0 - 17 */
    pattern?: number;
    /** 0 - 10000 */
    borderSoftness?: number;
    reverseDirection?: boolean;
    //...
  }
}