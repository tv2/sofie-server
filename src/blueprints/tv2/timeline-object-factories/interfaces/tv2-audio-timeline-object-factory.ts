import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2VideoClipManifestData } from '../../value-objects/tv2-action-manifest-data'
import { Tv2SourceMappingWithSound } from '../../value-objects/tv2-studio-blueprint-configuration'
import { DeviceType } from '../../../../model/enums/device-type'
import { Tv2AudioMode } from '../../enums/tv2-audio-mode'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2AudioTimelineObjectFactory {
  createTimelineObjectsForSource(configuration: Tv2BlueprintConfiguration, source: Tv2SourceMappingWithSound, audioMode?: Tv2AudioMode): Tv2BlueprintTimelineObject[]
  createStudioMicrophonesUpTimelineObject(configuration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createStudioMicrophonesDownTimelineObject(configuration: Tv2BlueprintConfiguration): Tv2BlueprintTimelineObject
  createStopAudioBedTimelineObject(duration: number): Tv2BlueprintTimelineObject
  createResynchronizeTimelineObject(): Tv2BlueprintTimelineObject
  createVideoClipAudioTimelineObjects(configuration: Tv2BlueprintConfiguration, videoClipData: Tv2VideoClipManifestData): Tv2BlueprintTimelineObject[]
  createBreakerAudioTimelineObject(): Tv2BlueprintTimelineObject
  getAudioDeviceType(): DeviceType
}
