import { ErrorCode } from '../../model/enums/error-code'
import { Exception } from '../../model/exceptions/exception'

export class DeviceAlreadyRemovedException extends Exception {
  constructor(deviceId: string) {
    super(ErrorCode.ALREADY_REMOVED, `Device with ID '${deviceId}' is already removed.`)
  }
}