import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

export interface CasparCgTemplateTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.CASPAR_CG
    type: CasparCgType.TEMPLATE
    templateType: string
    name: string
    data: CasparCgTemplateData
    useStopCommand: boolean
    mixer: {
      opacity?: number
    }
  }
}

// TODO: Move this to TV2 blueprints and split up the slots up into separate interfaces with a enumerated payload type.
export interface CasparCgTemplateData {
  display: CasparCgTemplateDisplayMode
  partialUpdate: boolean
  slots: {
    [CasparCgTemplateSlotType.FULLSCREEN_GRAPHICS]?: {
      display: CasparCgTemplateDisplayMode
      payload: {
        type: 'still'
        url: string,
        noAnimation: boolean
      }
    }
    [CasparCgTemplateSlotType.LOWER_THIRD]?: {
      display: CasparCgTemplateDisplayMode
      payload: {
        type: string
        0: string
      }
    }
    [CasparCgTemplateSlotType.IDENT]?: {
      display: CasparCgTemplateDisplayMode
      payload: {
        type: string
        0: string
      }
    }
    [CasparCgTemplateSlotType.SPLIT_SCREEN]?: {
      display: CasparCgTemplateDisplayMode
      payload: {
        type: 'locators'
        style: object
      }
    }
  }
}

export enum CasparCgTemplateSlotType {
  FULLSCREEN_GRAPHICS = '250_full',
  LOWER_THIRD = '450_lowerThird',
  IDENT = '650_ident',
  SPLIT_SCREEN = '850_dve',
}

export enum CasparCgTemplateDisplayMode {
  PROGRAM = 'program',
  PREVIEW = 'preview',
  HIDDEN = 'hidden',
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
    mixer?: {
      keyer?: boolean
    }
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
  MIX = 'MIX'
}

export enum CasparCgTransitionEase {
  LINEAR = 'LINEAR',
}

export enum CasparCgTransitionDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum CasparCgType {
  MEDIA = 'media',
  TEMPLATE = 'template',
}
