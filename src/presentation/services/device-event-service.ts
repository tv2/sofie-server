import { DeviceCreatedEvent, DeviceDeletedEvent, DeviceEvent, DeviceUpdatedEvent } from '../value-objects/device-event'
import { DeviceEventEmitter } from '../../business-logic/services/interfaces/device-event-emitter'
import { DeviceEventObserver } from '../interfaces/device-event-observer'
import { Device } from '../../model/entities/device'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'

export class DeviceEventService implements DeviceEventEmitter, DeviceEventObserver {

  private static instance: DeviceEventService
  private readonly callbacks: ((deviceEvent: DeviceEvent) => void)[] = []

  constructor(private readonly deviceEventBuilder: DeviceEventBuilder) {
  }

  public static getInstance(deviceBuilder: DeviceEventBuilder): DeviceEventService {
    if (!this.instance) {
      this.instance = new DeviceEventService(deviceBuilder)
    }
    return this.instance
  }

  private emitDeviceEvent(deviceEvent: DeviceEvent): void {
    this.callbacks.forEach(callback => callback(deviceEvent))
  }

  public subscribeToDeviceEvents(onDeviceEventCallback: (deviceEvent: DeviceEvent) => void): void {
    this.callbacks.push(onDeviceEventCallback)
  }

  public emitDeviceCreatedEvent(device: Device): void {
    const event: DeviceCreatedEvent = this.deviceEventBuilder.buildDeviceCreatedEvent(device)
    this.emitDeviceEvent(event)
  }

  public emitDeviceUpdatedEvent(device: Device): void {
    const event: DeviceUpdatedEvent = this.deviceEventBuilder.buildDeviceUpdatedEvent(device)
    this.emitDeviceEvent(event)
  }

  public emitDeviceDeletedEvent(deviceId: string): void {
    const event: DeviceDeletedEvent = this.deviceEventBuilder.buildDeviceDeletedEvent(deviceId)
    this.emitDeviceEvent(event)
  }
}