import { ErrorCode } from '../enums/error-code'
import { Exception } from './exception'

export class DeviceAlreadyConnectedException extends Exception {
  constructor(deviceId: string) {
    super(ErrorCode.ALREADY_EXIST, `Device with ID '${deviceId}' is already connected.`)
  }
}
