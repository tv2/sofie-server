import { DeviceServiceImplementation } from '../device-service-implementation'
import { Device, TelemetricsDevice } from '../../../model/entities/device'
import { mock, when, verify, instance } from '@typestrong/ts-mockito'
import { MongoDeviceRepository } from '../../../data-access/repositories/mongo/mongo-device-repository'
import { DeviceService } from '../interfaces/device-service'
import { DeviceEventEmitter } from '../interfaces/device-event-emitter'

describe('DeviceService', () => {
  let testDevice: TelemetricsDevice
  let deviceRepository: MongoDeviceRepository
  let deviceEventEmitter: DeviceEventEmitter
  const mockedValue = mock<MongoDeviceRepository>() 

  beforeEach(() => {
    testDevice = mock<TelemetricsDevice>()
    deviceRepository = instance(mockedValue)
    deviceEventEmitter = mock<DeviceEventEmitter>()
  })


  it('should read all configurations', async () => {
    const devices: Device[] = [testDevice]
    const mockedService = mock<DeviceService>()
    const testee: DeviceServiceImplementation = new DeviceServiceImplementation(deviceRepository, deviceEventEmitter)
    when(mockedService.getDevices()).thenReturn(Promise.resolve(devices))
    
    await testee.getDevices()

    verify(mockedValue.getDevices()).called()
  })

  it('should create a new configuration', async () => {
    const mockedService = mock<DeviceService>()
    const testee: DeviceServiceImplementation = new DeviceServiceImplementation(deviceRepository, deviceEventEmitter)
    when(mockedService.create(testDevice)).thenReturn(Promise.resolve())

    await testee.create(testDevice)

    verify(mockedValue.save(testDevice)).called()
  })
})
