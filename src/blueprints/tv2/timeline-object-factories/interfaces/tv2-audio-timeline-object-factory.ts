import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2VideoClipData } from '../../value-objects/tv2-video-clip-data'
import { Tv2SourceMappingWithSound } from '../../value-objects/tv2-studio-blueprint-configuration'

export interface Tv2AudioTimelineObjectFactory {
  createTimelineObjectsForSource(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound): TimelineObject[]
  createStudioMicrophonesUpTimelineObject(configuration: Tv2BlueprintConfiguration): TimelineObject
  createStudioMicrophonesDownTimelineObject(configuration: Tv2BlueprintConfiguration): TimelineObject
  createStopAudioBedTimelineObject(duration: number): TimelineObject
  createResynchronizeTimelineObject(): TimelineObject
  createVideoClipAudioTimelineObjects(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipData): TimelineObject[]
}
