import { DeviceEvent } from '../value-objects/device-event'
import { DeviceEventEmitter } from '../interfaces/device-event-emitter'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class DeviceEventService implements DeviceEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly deviceEventBuilder: DeviceEventBuilder) {
  }

  public emitVideoMixerConfigurationUpdated(videoMixerConfiguration: VideoMixerConfiguration): void {
    this.emitDeviceEvent(this.deviceEventBuilder.buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration))
  }

  private emitDeviceEvent(deviceEvent: DeviceEvent): void {
    this.typedEventEmitter.emitTypedEvent(deviceEvent)
  }
}
