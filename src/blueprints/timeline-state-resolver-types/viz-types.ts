import { TimelineObject } from '../../model/entities/timeline-object'
import { DeviceType } from '../../model/enums/device-type'
import { Tv2DownstreamKeyer } from '../tv2/value-objects/tv2-studio-blueprint-configuration'

export interface VizMseElementInternalTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.ELEMENT_INTERNAL
    templateName: string
    templateData: string[]
    showName: string
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
    direction: -1 | 1 | undefined // Taken directly from Blueprints. Perhaps can/should be changed.
    reference: string
  }
}

export interface VizMseClearGfxTimelineObject extends TimelineObject {
  content: {
    deviceType: DeviceType.VIZMSE
    type: VizType.CLEAR_ALL_ELEMENTS
    channelsToSendCommands?: string[]
    showName: string
  }
}

// Todo: determine if placed correctly, and give a fitting name
export interface GiveMeANameTimelineObject extends TimelineObject {
  content: {
    onAir: boolean
    config: Tv2DownstreamKeyer
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