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
      opacity: number
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
  }
  partialUpdate: boolean
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