import { DeviceType } from '../../../../sofie-ingest/domain/enums/device-type'
import { TimelineObject } from '../../../../rundown-execution/domain/entities/timeline-object'

export interface CasparcgTemplateTimelineObject<T> extends TimelineObject {
  content: {
    deviceType: DeviceType.CASPAR_CG
    type: CasparcgType.TEMPLATE
    templateType: CasparcgTemplateType
    name: string
    data: T
    useStopCommand: boolean
    mixer: Mixer
  }
}

interface Mixer {
  opacity?: number // Has to be a value between 0 and 1 to work correctly with CasparCG
  keyer?: boolean
  volume?: number
  // A lot more to be found in TSR.
}

export enum CasparcgTemplateType {
  // TSR needs the values to be lowercased.
  HTML = 'html',
  FLASH = 'flash'
}

export interface CasparcgMediaTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.CASPAR_CG
    type: CasparcgType.MEDIA
    file: string
    loop?: boolean
    seek?: number
    inPoint?: number
    length?: number
    playing?: boolean
    noStarttime?: boolean // The typo is used by TSR... :(
    channelLayout?: string
    mixer?: Mixer
    transitions?: {
      inTransition?: TimelineTransition
      outTransition?: TimelineTransition
    }
    audioFilter?: string
  }
}

interface TimelineTransition {
  type: CasparcgTransitionType
  duration: number
  easing: CasparcgTransitionEase
  direction: CasparcgTransitionDirection
}

export enum CasparcgTransitionType {
  MIX = 'MIX',
  CUT = 'CUT',
  PUSH = 'PUSH',
  WIPE = 'WIPE',
  SLIDE = 'SLIDE',
  STING = 'STING'
}

export enum CasparcgTransitionEase {
  LINEAR = 'LINEAR',
  // A lot more to be found in TSR.
}

export enum CasparcgTransitionDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum CasparcgType {
  MEDIA = 'media',
  TEMPLATE = 'template',
  // More to be found in TSR.
}
