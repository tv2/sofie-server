import { ErrorCode } from '../../model/enums/error-code'
import { Exception } from '../../model/exceptions/exception'

export class DeviceNotFoundException extends Exception {
  constructor(deviceId: string) {
    super(ErrorCode.NOT_FOUND,`Device with ID '${deviceId}' is not in the collection. Have you forgot to create the connection?`)
  }
}
