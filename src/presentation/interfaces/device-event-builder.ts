import {
  DeviceCreatedEvent,
  DeviceDeletedEvent,
  DeviceUpdatedEvent,
  VideoMixerConfigurationUpdatedEvent
} from '../value-objects/device-event'
import { VideoMixerConfiguration } from '../../model/value-objects/video-mixer-configuration'
import { Device } from '../../model/entities/devices/device'

export interface DeviceEventBuilder {
  buildDeviceCreatedEvent(device: Device): DeviceCreatedEvent
  buildDeviceUpdatedEvent(device: Device): DeviceUpdatedEvent
  buildDeviceDeletedEvent(deviceId: string): DeviceDeletedEvent

  buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration: VideoMixerConfiguration): VideoMixerConfigurationUpdatedEvent
}
