import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { Device } from '../../model/entities/device'
import { VideoMixerConfiguration } from '../../model/value-objects/video-mixer-configuration'

export type DeviceEvent = DeviceCreatedEvent | DeviceUpdatedEvent | DeviceDeletedEvent | VideoMixerConfigurationUpdatedEvent

export interface DeviceIdEvent extends TypedEvent {
  type: DeviceEventType,
  deviceId: string
}

export interface DeviceCreatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_CREATED
  device: Device
}

export interface DeviceUpdatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_UPDATED
  device: Device
}

export interface DeviceDeletedEvent extends DeviceIdEvent {
  type: DeviceEventType.DEVICE_DELETED
  deviceId: string
}

export interface VideoMixerConfigurationUpdatedEvent extends TypedEvent {
  type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED
  videoMixer: VideoMixerConfiguration
}
