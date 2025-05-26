import { DeviceConfiguration } from '../../model/entities/device-configuration'
import { Device } from '../../model/entities/devices/device'
import { DeviceType } from '../../model/enums/device-type'
import { INewsDevice } from '../../model/entities/devices/i-news-device'
import { TelemetricsDevice } from '../../model/entities/devices/telemetrics-device'
import { StatusMessageEventEmitter } from './interfaces/status-message-event-emitter'

export class DeviceFactory {

  constructor(private readonly statuesMessageEventEmitter: StatusMessageEventEmitter) {
  }

  public createDevice(deviceConfiguration: DeviceConfiguration, onStatusUpdatedCallback: (device: Device) => void): Device {
    switch (deviceConfiguration.type) {
      case DeviceType.INEWS: {
        return new INewsDevice(deviceConfiguration, this.statuesMessageEventEmitter, onStatusUpdatedCallback)
      }
      case DeviceType.TELEMETRICS: {
        return new TelemetricsDevice(deviceConfiguration, this.statuesMessageEventEmitter, onStatusUpdatedCallback)
      }
    }
  }
}
