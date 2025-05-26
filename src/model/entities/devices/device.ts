import { DeviceType } from '../../enums/device-type'
import { StatusCode } from '../../enums/status-code'
import { DeviceConfiguration } from '../device-configuration'
import { StatusMessageEventEmitter } from '../../../business-logic/services/interfaces/status-message-event-emitter'
import { StatusMessage } from '../status-message'

const RECONNECT_TIMEOUT_IN_MS: number = 10 * 1000

export abstract class Device {

  private timeoutIdentifier?: NodeJS.Timeout

  private statusCode: StatusCode = StatusCode.UNKNOWN
  private statusMessage: string = ''

  private isConnected: boolean = false
  private shouldTerminate: boolean = false

  protected constructor(
    private readonly configuration: DeviceConfiguration,
    private readonly statuesMessageEventEmitter: StatusMessageEventEmitter,
    private readonly onStatusUpdatedCallback: (device: Device) => void
  ) {
  }

  public getDeviceType(): DeviceType {
    return this.configuration.type
  }

  protected abstract connectToDevice(
    onConnectedCallback: () => void,
    onErrorCallback: (errorMessage: string) => void,
    onDisconnectedCallback: () => void
  ): void
  protected abstract disconnectFromDevice(): void

  public connect(): void {
    if (this.configuration.isDisabled) {
      return
    }
    this.shouldTerminate = false
    this.updateStatus(StatusCode.WARNING, 'Connecting...')
    this.connectToDevice(
      () => this.onDeviceConnectedCallback(),
      (errorMessage: string) => this.onDeviceErrorCallback(errorMessage),
      () => this.onDeviceDisconnectedCallback()
    )
  }

  private updateStatus(statusCode: StatusCode, statusMessage: string): void {
    this.statusCode = statusCode
    this.statusMessage = statusMessage
    this.onStatusUpdatedCallback(this)
    this.statuesMessageEventEmitter.emitStatusMessageEvent(this.createStatusMessage())
  }

  private createStatusMessage(): StatusMessage {
    return {
      id: `${this.getDeviceType()}_${this.configuration.id}`,
      title: this.configuration.name,
      message: this.statusMessage,
      statusCode: this.statusCode
    }
  }

  private onDeviceConnectedCallback(): void {
    this.isConnected = true
    this.updateStatus(StatusCode.GOOD, 'Connected')
  }

  private onDeviceErrorCallback(errorMessage: string): void {
    this.updateStatus(StatusCode.BAD, errorMessage)
  }

  private onDeviceDisconnectedCallback(): void {
    if (this.isConnected) {
      this.updateStatus(StatusCode.WARNING, 'Disconnected')
    }
    this.isConnected = false
    this.reconnect()
  }

  private reconnect(): void {
    if (this.timeoutIdentifier) {
      clearTimeout(this.timeoutIdentifier)
    }
    if (this.shouldTerminate) {
      return
    }
    this.timeoutIdentifier = setTimeout(() => {
      this.connect()
    }, RECONNECT_TIMEOUT_IN_MS)
  }

  public disconnect(): void {
    this.shouldTerminate = true
    if (this.timeoutIdentifier) {
      clearTimeout(this.timeoutIdentifier)
    }
    this.disconnectFromDevice()
  }

  public getId(): string {
    return this.configuration.id
  }

  public getConfiguration(): DeviceConfiguration {
    return this.configuration
  }

  public getStatusCode(): StatusCode {
    return this.statusCode
  }

  public getStatusMessage(): string {
    return this.statusMessage
  }
}
