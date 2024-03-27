import { DeviceChangedService } from '../device-changed-service'
import { anything, capture, instance, mock, when } from '@typestrong/ts-mockito'
import { DataChangedListener } from '../../../data-access/repositories/interfaces/data-changed-listener'
import { Device } from '../../../model/entities/device'
import { DeviceRepository } from '../../../data-access/repositories/interfaces/device-repository'
import { Logger } from '../../../logger/logger'
import { StatusMessageService } from '../interfaces/status-message-service'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { StatusCode } from '../../../model/enums/status-code'

describe(DeviceChangedService.name, () => {
  it('calls the StatusMessageService with a StatusMessage that has the same id as the Device', () => {
    const device: Device = EntityTestFactory.createDevice({ id: 'deviceId' })
    const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
    createTestee({ statusMessageService, deviceDataChangedListener })

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.id).toBe(device.id)
  })

  it('calls the StatusMessageService with a StatusMessage that has the Device name as title', () => {
    const device: Device = EntityTestFactory.createDevice({ statusMessage: 'some Message' })
    const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
    createTestee({ statusMessageService, deviceDataChangedListener })

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.message).toBe(device.statusMessage)
  })

  describe('the Device is not connected', () => {
    it('calls the StatusMessageService with a StatusCode BAD', () => {
      const device: Device = EntityTestFactory.createDevice({ isConnected: false, statusCode: StatusCode.UNKNOWN })
      const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({ statusMessageService, deviceDataChangedListener })

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(StatusCode.BAD)
    })

    it('calls the StatusMessageService with a NOT_CONNECTED message', () => {
      const device: Device = EntityTestFactory.createDevice({ isConnected: false, statusMessage: 'some message' })
      const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({ statusMessageService, deviceDataChangedListener })

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe('Not connected')
    })
  })

  describe('the Device is connected', () => {
    it('calls the StatusMessageService with a StatusMessage with a StatusCode matching the Device status', () => {
      const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.WARNING })
      const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({ statusMessageService, deviceDataChangedListener })

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(device.statusCode)
    })

    it('calls the StatusMessageService with a StatusMessage with a message matching the Device status message', () => {
      const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusMessage: 'Some message' })
      const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({ statusMessageService, deviceDataChangedListener })

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe(device.statusMessage)
    })
  })
})

function createTestee(params?: {
  statusMessageService?: StatusMessageService,
  deviceRepository?: DeviceRepository,
  deviceDataChangedListener?: DataChangedListener<Device>,
  logger?: Logger
}): DeviceChangedService {
  let deviceRepository: DeviceRepository
  if (!params?.deviceRepository) {
    const deviceRepositoryMock: DeviceRepository = mock<DeviceRepository>()
    when(deviceRepositoryMock.getDevices()).thenReturn(Promise.resolve([]))
    deviceRepository = deviceRepositoryMock
  } else {
    deviceRepository = params.deviceRepository
  }

  return new DeviceChangedService(
    instance(params?.statusMessageService ?? mock<StatusMessageService>()),
    instance(deviceRepository),
    instance(params?.deviceDataChangedListener ?? mock<DataChangedListener<Device>>()),
    instance(params?.logger ?? mock<Logger>())
  )
}

function createDeviceChangedListenerMock(device: Device): DataChangedListener<Device> {
  const deviceDataChangedListener: DataChangedListener<Device> = mock<DataChangedListener<Device>>()
  when(deviceDataChangedListener.onUpdated(anything())).thenCall(callback => callback(device))
  return deviceDataChangedListener
}
