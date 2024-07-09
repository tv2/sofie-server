import { StatusCode } from '../enums/status-code'

export abstract class Device {
  public _id: string
  private _name: string
  private _isConnected: boolean
  private _statusCode: StatusCode
  private _statusMessage: string

  constructor(id: string, name: string, isConnected: boolean, statusCode: StatusCode, statusMessage: string) {
    this._id = id
    this._name = name
    this._isConnected = isConnected
    this._statusCode = statusCode
    this._statusMessage = statusMessage
  }

  public abstract connect(): void
  
  public get id(): string {
    return this._id
  }

  public get name(): string {
    return this._name
  }

  public get isConnected(): boolean {
    return this._isConnected
  }

  public get statusCode(): StatusCode {
    return this._statusCode
  }

  public get statusMessage(): string {
    return this._statusMessage
  }

  public set id(value: string) {
    this._id = value
  }

  public set name(value: string) {
    this._name = value
  }

  public set isConnected(value: boolean) {
    this._isConnected = value
  }

  public set statusCode(value: StatusCode) {
    this._statusCode = value
  }

  public set statusMessage(value: string) {
    this._statusMessage = value
  }
}

export class DeviceDbDto {
  public type: string = 'Device'
  public id: string
  public name: string
  public isConnected: boolean
  public statusCode: StatusCode
  public statusMessage: string

  constructor(device: Device) {
    this.id = device.id
    this.name = device.name
    this.isConnected = device.isConnected
    this.statusCode = device.statusCode
    this.statusMessage = device.statusMessage
  }

}

export class DeviceRestDto {
  public type: string = 'Device'
  public id: string
  public name: string
  public isConnected: boolean
  public status: string 

  constructor(device: Device) {
    this.id = device.id
    this.name = device.name
    this.isConnected = device.isConnected
    this.status = device.statusMessage
  }
}