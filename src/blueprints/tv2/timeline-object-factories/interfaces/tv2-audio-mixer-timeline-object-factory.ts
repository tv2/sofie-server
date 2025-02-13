import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2VideoClipManifestData } from '../../value-objects/tv2-action-manifest-data'
import { Tv2SourceMappingWithAudio } from '../../value-objects/tv2-studio-blueprint-configuration'
import { DeviceType } from '../../../../model/enums/device-type'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-blueprint-timeline-object'
import { AudioMode } from '../../../../model/enums/audio-mode'

export interface Tv2AudioMixerTimelineObjectFactory {
  createTimelineObjectsForSource(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithAudio, audioMode?: AudioMode): Tv2BlueprintTimelineObject[]
  createStudioMicrophonesUpTimelineObject(configuration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createStudioMicrophonesDownTimelineObject(configuration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createStopAudioBedTimelineObject(duration: number): Tv2BlueprintTimelineObject
  createResynchronizeTimelineObject(): Tv2BlueprintTimelineObject
  createVideoClipAudioTimelineObjects(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): Tv2BlueprintTimelineObject[]
  createBreakerAudioTimelineObject(): Tv2BlueprintTimelineObject
  createAudioBedAudioTimelineObject(): Tv2BlueprintTimelineObject
  getAudioDeviceType(): DeviceType
}
