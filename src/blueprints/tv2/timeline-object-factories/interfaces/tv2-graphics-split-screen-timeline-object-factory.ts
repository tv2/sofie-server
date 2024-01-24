import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'
import { GraphicsSetup, SplitScreenConfiguration } from '../../value-objects/tv2-show-style-blueprint-configuration'

export interface Tv2GraphicsSplitScreenTimelineObjectFactory {
  createSplitScreenKeyTimelineObject(keyFilePath: string): Tv2BlueprintTimelineObject
  createSplitScreenFrameTimelineObject(frameFilePath: string): Tv2BlueprintTimelineObject
  createSplitScreenLocatorTimelineObject(graphicsSetup: GraphicsSetup, splitScreenConfiguration: SplitScreenConfiguration, locatorLabels?: string[]): Tv2BlueprintTimelineObject
}
