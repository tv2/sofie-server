import { Device } from '../../model/entities/device'
import { DeviceConnection } from './interfaces/inewsgateway-device-connection'

export class INewsGatewayDeviceConnection implements DeviceConnection {
  private readonly device: Device
  private isConnectingOrDisconnecting: boolean = false

  constructor(_device: Device) {
    this.device = _device
  }

  public async send(_deviceId: string, _params: string[]): Promise<void> {
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async listen(_deviceId: string, _callback: (data: unknown) => void): Promise<void> {
    // For now: Simulate an async operation, e.g., network request
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  public async connect(): Promise<boolean> {
    if (this.isConnectingOrDisconnecting) {
      throw new Error('Device is already connecting or disconnecting.')
    }
    this.isConnectingOrDisconnecting = true

    try {
      // Implement connection logic here

      // For now: Simulate an async operation, e.g., network request
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.device.isConnected = true
      return true
    } catch (error) {
      this.device.isConnected = false
      return false
    } finally {
      this.isConnectingOrDisconnecting = false
    }
  }

  public async disconnect(): Promise<boolean> {
    if (this.isConnectingOrDisconnecting) {
      throw new Error('Device is already connecting or disconnecting.')
    }
    this.isConnectingOrDisconnecting = true

    try {
      // Implement disconnection logic here

      // For now: Simulate an async operation, e.g., network request
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.device.isConnected = false
      return true
    } catch (error) {
      this.device.isConnected = true
      return false
    } finally {
      this.isConnectingOrDisconnecting = false
    }
  }
}
  