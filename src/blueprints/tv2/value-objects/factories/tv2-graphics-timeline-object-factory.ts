import { Tv2BlueprintConfiguration } from '../tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2GraphicActionManifest } from '../tv2-action-manifest'


export interface Tv2GraphicsTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createOverlayInitializeTimelineObject(duration: number): TimelineObject
  createContinueGraphicsTimelineObject(duration: number): TimelineObject
  createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createFullGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicActionManifest): TimelineObject
}