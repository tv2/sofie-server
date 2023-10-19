import { Tv2DownstreamKeyer } from '../tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'

export interface Tv2VideoMixerTimelineObjectFactory {
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
}