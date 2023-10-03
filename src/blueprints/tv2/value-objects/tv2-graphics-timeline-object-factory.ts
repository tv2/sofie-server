import { Tv2BlueprintConfiguration } from './tv2-blueprint-configuration'
import { TimelineObject } from '../../../model/entities/timeline-object'

export interface Tv2GraphicsTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createOverlayInitializeTimelineObject(duration: number): TimelineObject
  createContinueGraphicsTimelineObject(duration: number): TimelineObject
}