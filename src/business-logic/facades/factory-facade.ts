import { LoggerFacade } from '../../logger/logger-facade'
import { DeviceConnectionFactoryImplementation } from '../device-factories/device-connection-factory'
import { DeviceConnectionFactory } from '../services/interfaces/device-connection-factory'

export class FactoryFacade {
  public static createDeviceConnectionFactory(): DeviceConnectionFactory {
    return new DeviceConnectionFactoryImplementation(LoggerFacade.createLogger())
  }
}