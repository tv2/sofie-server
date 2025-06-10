import { DeviceEvent } from '../value-objects/device-event'
import { DeviceEventEmitter } from '../../business-logic/services/interfaces/device-event-emitter'
import { DeviceEventObserver } from '../interfaces/device-event-observer'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'
import { VideoMixerConfiguration } from '../../rundown-execution/domain/value-objects/video-mixer-configuration'

export class DeviceEventService implements DeviceEventEmitter, DeviceEventObserver {

  private static instance: DeviceEventService
  private readonly callbacks: ((deviceEvent: DeviceEvent) => void)[] = []

  constructor(private readonly deviceEventBuilder: DeviceEventBuilder) {
  }

  public static getInstance(deviceBuilder: DeviceEventBuilder): DeviceEventService {
    this.instance ??= new DeviceEventService(deviceBuilder)
    return this.instance
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
