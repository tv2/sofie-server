import { VideoMixerConfiguration } from '../../../model/value-objects/video-mixer-configuration'

export interface DeviceEventEmitter {
  emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void
}
