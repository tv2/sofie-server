import { DeviceEvent } from '../value-objects/device-event'
import { DeviceEventEmitter } from '../interfaces/device-event-emitter'
import { DeviceEventObserver } from '../interfaces/device-event-observer'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'

export class DeviceEventService implements DeviceEventEmitter, DeviceEventObserver {
  private readonly callbacks: ((deviceEvent: DeviceEvent) => void)[] = []

  public constructor(private readonly deviceEventBuilder: DeviceEventBuilder) {
  }

  private emitDeviceEvent(deviceEvent: DeviceEvent): void {
    this.callbacks.forEach(callback => callback(deviceEvent))
  }

  public subscribeToDeviceEvents(onDeviceEventCallback: (deviceEvent: DeviceEvent) => void): void {
    this.callbacks.push(onDeviceEventCallback)
  }

  public emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void {
    this.emitDeviceEvent(this.deviceEventBuilder.buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration))
  }
}
