import { VideoMixerConfiguration } from '../../../model/value-objects/video-mixer-configuration'

export interface VideoMixerDeviceRepository {
  getVideoMixerConfiguration(): Promise<VideoMixerConfiguration>
}
