import { TimelineObject } from '../../../../model/entities/timeline-object'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2VideoClipManifestData } from '../../value-objects/tv2-action-manifest-data'
import { Tv2SourceMappingWithSound } from '../../value-objects/tv2-studio-blueprint-configuration'
import { DeviceType } from '../../../../model/enums/device-type'
import { Tv2AudioMode } from '../../enums/tv2-audio-mode'

export interface Tv2AudioTimelineObjectFactory {
  createTimelineObjectsForSource(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, audioMode?: Tv2AudioMode): TimelineObject[]
  createStudioMicrophonesUpTimelineObject(configuration: Tv2BlueprintConfiguration): TimelineObject
  createStudioMicrophonesDownTimelineObject(configuration: Tv2BlueprintConfiguration): TimelineObject
  createStopAudioBedTimelineObject(duration: number): TimelineObject
  createResynchronizeTimelineObject(): TimelineObject
  createVideoClipAudioTimelineObjects(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): TimelineObject[]
  createBreakerAudioTimelineObject(): TimelineObject
  getAudioDeviceType(): DeviceType
}
