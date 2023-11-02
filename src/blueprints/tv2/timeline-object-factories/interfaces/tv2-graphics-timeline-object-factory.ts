import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2GraphicsData } from '../../value-objects/tv2-action-manifest-data'

export interface Tv2GraphicsTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createOverlayInitializeTimelineObject(duration: number): TimelineObject
  createContinueGraphicsTimelineObject(duration: number): TimelineObject
  createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): TimelineObject
  createIdentGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, graphicsData: Tv2GraphicsData): TimelineObject
}
