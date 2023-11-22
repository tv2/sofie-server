import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2GraphicsSplitScreenTimelineObjectFactory {
  createSplitScreenKeyTimelineObject(keyFilePath: string): Tv2BlueprintTimelineObject
  createSplitScreenFrameTimelineObject(frameFilePath: string): Tv2BlueprintTimelineObject
  createSplitScreenLocatorTimelineObject(): Tv2BlueprintTimelineObject
}
