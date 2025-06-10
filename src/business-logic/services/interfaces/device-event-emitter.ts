import { VideoMixerConfiguration } from '../../../rundown-execution/domain/value-objects/video-mixer-configuration'

export interface DeviceEventEmitter {
  emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void
}
