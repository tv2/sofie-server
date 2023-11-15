import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../../value-objects/tv2-action-manifest-data'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2GraphicsElementTimelineObjectFactory {
  createFullscreenGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): Tv2BlueprintTimelineObject
  createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): Tv2BlueprintTimelineObject
  createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): Tv2BlueprintTimelineObject
}
