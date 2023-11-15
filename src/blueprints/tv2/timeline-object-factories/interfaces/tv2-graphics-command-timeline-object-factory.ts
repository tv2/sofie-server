import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'

export interface Tv2GraphicsCommandTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
  createOverlayInitializeTimelineObject(): TimelineObject
  createContinueGraphicsTimelineObject(): TimelineObject
  createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
  createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
}
