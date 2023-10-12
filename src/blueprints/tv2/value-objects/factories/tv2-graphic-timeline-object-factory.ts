import { Tv2BlueprintConfiguration } from '../tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'

export interface Tv2GraphicTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createOverlayInitializeTimelineObject(duration: number): TimelineObject
  createContinueGraphicTimelineObject(duration: number): TimelineObject
  createClearGraphicTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createAllOutGraphicTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
}