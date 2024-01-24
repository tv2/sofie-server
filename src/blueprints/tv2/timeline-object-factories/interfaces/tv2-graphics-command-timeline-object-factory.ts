import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2GraphicsCommandTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createOverlayInitializeTimelineObject(): Tv2BlueprintTimelineObject
  createContinueGraphicsTimelineObject(): Tv2BlueprintTimelineObject
  createClearGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createAllOutGraphicsTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
}
