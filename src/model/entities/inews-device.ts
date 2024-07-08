import { StatusCode } from '../enums/status-code'
import { Device, DeviceDbDto, DeviceRestDto } from './device'

export class INewsDevice extends Device {
  public type: string = 'iNewsDevice'
  private _username: string
  private _password: string

  constructor(id: string, name: string, isConnected: boolean, statusCode: StatusCode, statusMessage: string, username: string, password: string) {
    super(id, name, isConnected, statusCode, statusMessage)
    this._username = username
    this._password = password
  }

  // Getters
  public get username(): string {
    return this._username
  }

  public get password(): string {
    return this._password
  }

  //Setters
  public set username(value: string){
    this._username = value
  }

  public set password(value: string){
    this._password = value
  }

  public connect(): void {
    console.log('Connecting to inews device...')
  }
}

export class INewsDeviceDBDTO extends DeviceDbDto {
  public type: string = 'INewsDevice'
  private _username: string
  private _password: string

  constructor(device: Device, username: string, password: string) {
    super(device)
    this._username = username
    this._password = password
  }

  // Getters
  public get username(): string {
    return this._username
  }

  public get password(): string {
    return this._password
  }

  //Setters
  public set username(value: string){
    this._username = value
  }
  
  public set password(value: string){
    this._password = value
  }
}

export class INewsDeviceRestDTO extends DeviceRestDto {
  public type: string = 'INewsDevice'
  private _username: string
  private _password: string

  constructor(device: Device, username: string, password: string) {
    super(device)
    this._username = username
    this._password = password
  }

  // Getters
  public get username(): string {
    return this._username
  }

  public get password(): string {
    return this._password
  }

  //Setters
  public set username(value: string){
    this._username = value
  }
  
  public set password(value: string){
    this._password = value
  }
}
