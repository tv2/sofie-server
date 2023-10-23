import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { AtemFullPilotTimelineObjectProperties } from '../../../timeline-state-resolver-types/atem-types'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'


export interface Tv2VideoMixerTimelineObjectFactory {
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createFullPilotTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration, properties: AtemFullPilotTimelineObjectProperties): TimelineObject[]
  createDownstreamKeyerFullPilotTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[]
}
