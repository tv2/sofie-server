import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { TimelineObject } from '../../../../model/entities/timeline-object'
import { TimelineEnable } from '../../../../model/entities/timeline-enable'
import { DveBoxProperties, DveLayoutProperties } from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'

export interface Tv2VideoMixerTimelineObjectFactory {
  createProgramTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createCleanFeedTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createLookaheadTimelineObject(sourceInput: number, enable: TimelineEnable): TimelineObject
  createDownstreamKeyerTimelineObject(downstreamKeyer: Tv2DownstreamKeyer, onAir: boolean): TimelineObject
  createDveBoxesTimelineObject(boxes: DveBoxProperties[], priority?: number): TimelineObject
  createDvePropertiesTimelineObject(configuration: Tv2BlueprintConfiguration, layoutProperties: DveLayoutProperties): TimelineObject

  getDveBoxesLayer(): string
}
