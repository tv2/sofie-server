import { DeviceServiceImplementation } from '../device-service-implementation'
import { Device } from '../../../model/entities/device'
import { mock, when, verify, instance } from '@typestrong/ts-mockito'
import { StatusCode } from '../../../model/enums/status-code'
import { TelemetricsDevice } from '../../../model/entities/telemetrics-device'
import { MongoDeviceRepository } from '../../../data-access/repositories/mongo/mongo-device-repository'
import { DeviceService } from '../interfaces/device-service'

describe('DeviceService', () => {
  let testDevice: TelemetricsDevice
  let deviceRepository: MongoDeviceRepository
  const mockedValue = mock<MongoDeviceRepository>() 

  beforeEach(() => {
    testDevice = new TelemetricsDevice('', 'testDevice', true, StatusCode.GOOD, 'All good', 'https://localhost:22544')
    deviceRepository = instance(mockedValue)
  })

  afterEach(() => {
  })

  it('should read all configurations', async () => {
    const devices: Device[] = [testDevice]
    const mockedService = mock<DeviceService>()
    const testee: DeviceServiceImplementation = new DeviceServiceImplementation(deviceRepository)
    when(mockedService.readAllDeviceConfigurations()).thenReturn(Promise.resolve(devices))
    
    await testee.readAllDeviceConfigurations()

    verify(mockedValue.findAllDevices()).called()
  })

  it('should create a new configuration', async () => {
    const mockedService = mock<DeviceService>()
    const testee: DeviceServiceImplementation = new DeviceServiceImplementation(deviceRepository)
    when(mockedService.create(testDevice)).thenReturn(Promise.resolve())

    await testee.create(testDevice)

    verify(mockedValue.create(testDevice)).called()
  })
})
