import { DeviceEventType } from '../enums/event-type'
import { TypedEvent } from './typed-event'
import { VideoMixerConfiguration } from '../../model/value-objects/video-mixer-configuration'
import { DeviceDto } from '../dtos/device-dto'

export type DeviceEvent = DeviceCreatedEvent | DeviceUpdatedEvent | DeviceDeletedEvent | VideoMixerConfigurationUpdatedEvent

export interface DeviceIdEvent extends TypedEvent {
  type: DeviceEventType,
  deviceId: string
}

export interface DeviceCreatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_CREATED
  device: DeviceDto
}

export interface DeviceUpdatedEvent extends TypedEvent {
  type: DeviceEventType.DEVICE_UPDATED
  device: DeviceDto
}

export interface DeviceDeletedEvent extends DeviceIdEvent {
  type: DeviceEventType.DEVICE_DELETED
  deviceId: string
}

export interface VideoMixerConfigurationUpdatedEvent extends TypedEvent {
  type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED
  videoMixer: VideoMixerConfiguration
}
