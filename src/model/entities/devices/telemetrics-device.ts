import { StatusCode } from '../../enums/status-code'
import { Device } from './device'
import { TelemetricsDeviceConfiguration } from '../device-configuration'
import { StatusMessageEventEmitter } from '../../../business-logic/services/interfaces/status-message-event-emitter'

// TODO: This is not a final implementation. This is a "placeholder" until we make the real implementation.
export class TelemetricsDevice extends Device {

  private onDisconnectedCallback: () => void

  constructor(
    private readonly telemetricsDeviceConfiguration: TelemetricsDeviceConfiguration,
    statuesMessageEventEmitter: StatusMessageEventEmitter,
    onStatusUpdatedCallback: (device: Device) => void
  ) {
    super(telemetricsDeviceConfiguration, statuesMessageEventEmitter, onStatusUpdatedCallback)
  }

  public getStatusCode(): StatusCode {
    return StatusCode.UNKNOWN
  }

  protected connectToDevice(onConnectedCallback: () => void, _onErrorCallback: (errorMessage: string) => void, onDisconnectedCallback: () => void): void {
    console.log('Connecting to Telemetrics devices...')
    onConnectedCallback()
    this.onDisconnectedCallback = onDisconnectedCallback
  }

  protected disconnectFromDevice(): void {
    console.log('Disconnecting from Telemetrics devices...')
    this.onDisconnectedCallback()
  }
}
