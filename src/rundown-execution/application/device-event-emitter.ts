import { VideoMixerConfiguration } from '../domain/value-objects/video-mixer-configuration'

export interface DeviceEventEmitter {
  emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void
}
