import { Tv2BlueprintConfiguration } from '../tv2-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2DownstreamKeyer } from '../tv2-studio-blueprint-configuration'

export interface Tv2GfxTimelineObjectFactory {
  createThemeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createOverlayInitializeTimelineObject(duration: number): TimelineObject
  createContinueGfxTimelineObject(duration: number): TimelineObject
  createGfxClearTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createGfxAlternativeOutTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, duration: number): TimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, layer: string, onAir: boolean): TimelineObject
}