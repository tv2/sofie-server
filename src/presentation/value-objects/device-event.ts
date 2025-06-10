import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { VideoMixerConfiguration } from '../../rundown-execution/domain/value-objects/video-mixer-configuration'

export type DeviceEvent = VideoMixerConfigurationUpdatedEvent

export interface VideoMixerConfigurationUpdatedEvent extends TypedEvent {
  type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED
  videoMixer: VideoMixerConfiguration
}
