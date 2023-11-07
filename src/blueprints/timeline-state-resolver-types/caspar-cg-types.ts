import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

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

export interface CasparCgTemplateData {
  display: string
  slots: {
    '250_full'?: {
      payload: {
        type: string
        url: string,
        noAnimation: boolean
      }
      display: string
    }
    '260_overlay'?: object
    '450_lowerThird'?: {
      payload: {
        type: string
        0: string
      }
      display: string
    }
    '650_ident'?: {
      payload: {
        type: string
        0: string
      }
      display: string
    }
  }
  partialUpdate: boolean
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
  }
}

export enum CasparCgType {
  MEDIA = 'media',
  IP = 'ip',
  INPUT = 'input',
  TEMPLATE = 'template',
  HTML_PAGE = 'htmlpage',
  ROUTE = 'route',
  RECORD = 'record'
}
