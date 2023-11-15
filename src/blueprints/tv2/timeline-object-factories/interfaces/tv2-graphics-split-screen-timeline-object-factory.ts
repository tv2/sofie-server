import { TimelineObject } from '../../../../model/entities/timeline-object'

export interface Tv2GraphicsSplitScreenTimelineObjectFactory {
  createSplitScreenKeyTimelineObject(keyFilePath: string): TimelineObject
  createSplitScreenFrameTimelineObject(frameFilePath: string): TimelineObject
  createSplitScreenLocatorTimelineObject(): TimelineObject
}
