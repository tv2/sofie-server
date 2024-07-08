import { DeviceService } from '../interfaces/device-service'
import { Device } from '../../../model/entities/device'
import { mock, instance, when, verify, reset } from '@typestrong/ts-mockito'

describe('DeviceService', () => {
  let service: DeviceService
  let mockedService: DeviceService

  beforeEach(() => {
    mockedService = mock<DeviceService>()
    service = instance(mockedService)
  })

  afterEach(() => {
    reset(mockedService)
  })

  it('should read all configurations', async () => {
    const devices: Device[] = [/* create sample devices */]
    when(mockedService.readAllConfigurations()).thenReturn(Promise.resolve(devices))

    const result = await service.readAllConfigurations()

    expect(result).toEqual(devices)
    verify(mockedService.readAllConfigurations()).called()
  })

  it('should read configuration for a specific device', async () => {
    const device = mock<Device>()
    when(mockedService.readConfiguration(device.id)).thenReturn(Promise.resolve(device))

    await service.readConfiguration(device.id)
    
    verify(mockedService.readConfiguration(device.id)).called()
  }, 100)

  it('should create a new configuration', async () => {
    const device: Device = mock<Device>()
    when(mockedService.create(device)).thenReturn(Promise.resolve())

    await service.create(device)

    verify(mockedService.create(device)).called()
  })
})
