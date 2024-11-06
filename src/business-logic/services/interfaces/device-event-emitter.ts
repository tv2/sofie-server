import { Device } from '../../../model/entities/device'
import { VideoMixerConfiguration } from '../../../model/value-objects/video-mixer-configuration'

export interface DeviceEventEmitter {
  emitDeviceCreatedEvent(device: Device): void
  emitDeviceUpdatedEvent(device: Device): void
  emitDeviceDeletedEvent(deviceId: string): void

  emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void
}
