import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'

export interface Tv2VideoMixerTimelineObjectFactory {
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createProgramTimelineObject(start: number, input: number, transition: number, transitionSettings?: unknown): TimelineObject
  createCleanTimelineObject(start: number, input: number, transition: number, transitionSettings?: unknown): TimelineObject
  createNextAuxTimelineObject(input: number): TimelineObject
  createDownstreamKeyerFullPilotTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject
  createUpstreamKeyerFullPilotTimelineObject(blueprintConfiguration: Tv2BlueprintConfiguration, start: number): TimelineObject
}
