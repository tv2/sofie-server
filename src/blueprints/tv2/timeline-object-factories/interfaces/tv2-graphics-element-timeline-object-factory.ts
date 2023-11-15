import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import {
  Tv2FullscreenGraphicsManifestData,
  Tv2OverlayGraphicsManifestData
} from '../../value-objects/tv2-action-manifest-data'

export interface Tv2GraphicsElementTimelineObjectFactory {
  createFullscreenGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2FullscreenGraphicsManifestData): TimelineObject
  createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): TimelineObject
  createLowerThirdGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2OverlayGraphicsManifestData): TimelineObject
}
