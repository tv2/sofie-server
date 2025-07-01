import { VideoMixerConfiguration } from '../value-objects/video-mixer-configuration'

export interface VideoMixerDeviceRepository {
  getVideoMixerConfiguration(): Promise<VideoMixerConfiguration>
}
