import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

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
