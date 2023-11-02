import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'

export const enum VizMseTransitionType { // Taken directly from blueprint.
  DELAY = 0
}

export interface VizMseElementInternalTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.ELEMENT_INTERNAL
    templateName: string
    templateData: string[]
    showName: string
    channelName?: string
  }
}

export interface VizMseElementPilotTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.ELEMENT_PILOT
    templateVcpId: number
    continueStep: number
    noAutoPreloading: boolean
    channelName: string
    delayTakeAfterOutTransition?: boolean
    outTransition?: {
      type: VizMseTransitionType.DELAY
      delay: number
    }
  }
}

export interface VizMseLoadAllElementsTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.LOAD_ALL_ELEMENTS
  }
}

export interface VizMseContinueTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.CONTINUE
    direction: -1 | 1 | undefined // Taken directly from Blueprints.
    reference: string
  }
}

export interface VizMseClearGraphicsTimelineObjectContent {
  deviceType: DeviceType.VIZMSE
  type: VizType.CLEAR_ALL_ELEMENTS
  channelsToSendCommands?: string[]
  showName: string
}

export enum VizType {
  ELEMENT_INTERNAL = 'element_internal',
  ELEMENT_PILOT = 'element_pilot',
  CONTINUE = 'continue',
  LOAD_ALL_ELEMENTS = 'load_all_elements',
  CLEAR_ALL_ELEMENTS = 'clear_all_elements',
  CLEANUP_SHOWS = 'cleanup_shows',
  INITIALIZE_SHOWS = 'initialize_shows',
  CONCEPT = 'concept'
}