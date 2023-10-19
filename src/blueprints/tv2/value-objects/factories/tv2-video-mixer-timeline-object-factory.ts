import { Tv2DownstreamKeyer } from '../tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2BlueprintConfiguration } from '../tv2-blueprint-configuration'
import { AtemFullPilotTimelineObjectProperties } from '../../../timeline-state-resolver-types/atem-types'


export interface Tv2VideoMixerTimelineObjectFactory {
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createFullPilotTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration, properties: AtemFullPilotTimelineObjectProperties): TimelineObject[]
  createDownstreamKeyerFullPilotTimelineObjects(blueprintConfiguration: Tv2BlueprintConfiguration): TimelineObject[]
}