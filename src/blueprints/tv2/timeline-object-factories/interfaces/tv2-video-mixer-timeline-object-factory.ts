import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable, transition?: number, transitionSettings?: unknown): TimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable, transition?: number, transitionSettings?: unknown): TimelineObject
  createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean, enable: TimelineEnable, priority: number): TimelineObject
  createUpstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, enable: TimelineEnable): TimelineObject
}
