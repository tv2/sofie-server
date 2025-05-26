import { DeviceConfiguration } from '../../../model/entities/device-configuration'

export interface DeviceConfigurationRepository {
  getDeviceConfigurations(): Promise<DeviceConfiguration[]>
  getDeviceConfiguration(deviceConfigurationId: string): Promise<DeviceConfiguration>
  create(deviceConfiguration: DeviceConfiguration): Promise<DeviceConfiguration>
  update(deviceConfiguration: DeviceConfiguration): Promise<void>
  delete(deviceConfigurationId: string): Promise<void>
}
