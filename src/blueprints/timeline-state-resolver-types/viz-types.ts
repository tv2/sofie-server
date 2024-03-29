import { DeviceType } from '../../model/enums/device-type'
import { TimelineObject } from '../../model/entities/timeline-object'

export const enum VizMseTransitionType {
  DELAY = 0
}

export interface VizMseElementInternalTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZ_MSE
    type: VizType.ELEMENT_INTERNAL
    templateName: string
    templateData: string[]
    showName: string
    channelName?: string
  }
}

export interface VizMseElementPilotTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZ_MSE
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
    deviceType: DeviceType.VIZ_MSE
    type: VizType.LOAD_ALL_ELEMENTS
  }
}

export interface VizMseContinueTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZ_MSE
    type: VizType.CONTINUE
    direction: VizMseContinueDirection
    reference: string
  }
}

export enum VizMseContinueDirection {
  BACKWARD = -1,
  FORWARD = 1
}

export interface VizMseClearGraphicsTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZ_MSE
    type: VizType.CLEAR_ALL_ELEMENTS
    channelsToSendCommands?: string[]
    showName: string
  }
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
