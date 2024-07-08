import { StatusCode } from '../enums/status-code'
import { CoreDevice } from './core-device'

export class Device implements CoreDevice {
  public type: string = 'Device'
  private _id: string = 'Device'
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
  
  public connect(): void{
    console.log('connecting')
  }

  // Getters
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

  // Setters
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

export class DeviceDBDTO {
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

  public toDevice(): Device {
    return new Device(this.id, this.name, this.isConnected, this.statusCode, this.statusMessage)
  }
}

export class DeviceRestDTO {
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