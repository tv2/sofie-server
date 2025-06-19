import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'
import { DeviceEventType } from '../enums/device-event-type'

export type DeviceEvent = VideoMixerConfigurationUpdatedEvent

export interface VideoMixerConfigurationUpdatedEvent extends TypedEvent {
  type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED
  videoMixer: VideoMixerConfiguration
}
