import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

export interface CasparCgTemplateTimelineObject<T> extends TimelineObject {
  content: {
    deviceType: DeviceType.CASPAR_CG
    type: CasparCgType.TEMPLATE
    templateType: CasparCgTemplateType
    name: string
    data: T
    useStopCommand: boolean
    mixer: Mixer
  }
}

interface Mixer {
  opacity?: number
  keyer?: boolean
  // A lot more to be found in TSR.
}

export enum CasparCgTemplateType {
  // TSR needs the values to be lowercased.
  HTML = 'html',
  FLASH = 'flash'
}

export interface CasparCgMediaTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.CASPAR_CG
    type: CasparCgType.MEDIA
    file: string,
    loop?: boolean
    seek?: number
    inPoint?: number
    length?: number
    playing?: boolean
    noStarttime?: boolean // The typo is used by TSR... :(
    mixer?: Mixer
    transitions?: {
      inTransition?: TimelineTransition
    }
  }
}

interface TimelineTransition {
  type: CasparCgTransitionType
  duration: number
  easing: CasparCgTransitionEase
  direction: CasparCgTransitionDirection
}

export enum CasparCgTransitionType {
  MIX = 'MIX',
  CUT = 'CUT',
  PUSH = 'PUSH',
  WIPE = 'WIPE',
  SLIDE = 'SLIDE',
  STING = 'STING'
}

export enum CasparCgTransitionEase {
  LINEAR = 'LINEAR',
  // A lot more to be found in TSR.
}

export enum CasparCgTransitionDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum CasparCgType {
  MEDIA = 'media',
  TEMPLATE = 'template',
  // More to be found in TSR.
}
