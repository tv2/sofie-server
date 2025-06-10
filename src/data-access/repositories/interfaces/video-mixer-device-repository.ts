import { VideoMixerConfiguration } from '../../../rundown-execution/domain/value-objects/video-mixer-configuration'

export interface VideoMixerDeviceRepository {
  getVideoMixerConfiguration(): Promise<VideoMixerConfiguration>
}
