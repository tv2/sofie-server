import { VideoMixerConfigurationUpdatedEvent } from '../value-objects/device-event'
import { VideoMixerConfiguration } from '../../model/value-objects/video-mixer-configuration'

export interface DeviceEventBuilder {
  buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration: VideoMixerConfiguration): VideoMixerConfigurationUpdatedEvent
}
