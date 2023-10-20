import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
}
