import { DeviceServiceImplementation } from '../device-service-implementation'
import { Device } from '../../../model/entities/device'
import { mock, instance, when, verify, reset } from '@typestrong/ts-mockito'
import { StatusCode } from '../../../model/enums/status-code'
import { INewsDevice } from '../../../model/entities/inews-device'

describe('DeviceService', () => {
  let service: DeviceServiceImplementation
  let mockedService: DeviceServiceImplementation

  beforeEach(() => {
    mockedService = mock<DeviceServiceImplementation>()
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
    const device = new INewsDevice('my-device', 'My Device', false, StatusCode.GOOD, 'A message', 'JohnDoe', 'JohnsPassword')

    when(mockedService.readConfiguration(device.id)).thenReturn(Promise.resolve(device))

    await service.readConfiguration(device.id)
    
    verify(mockedService.readConfiguration(device.id)).called()
  })

  it('should create a new configuration', async () => {
    const device: Device = mock<Device>()
    when(mockedService.create(device)).thenReturn(Promise.resolve())

    await service.create(device)

    verify(mockedService.create(device)).called()
  })
})
