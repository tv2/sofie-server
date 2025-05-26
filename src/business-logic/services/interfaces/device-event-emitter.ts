import { VideoMixerConfiguration } from '../../../model/value-objects/video-mixer-configuration'
import { Device } from '../../../model/entities/devices/device'

export interface DeviceEventEmitter {
  emitDeviceCreatedEvent(device: Device): void
  emitDeviceUpdatedEvent(device: Device): void
  emitDeviceDeletedEvent(deviceId: string): void

  emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void
}
