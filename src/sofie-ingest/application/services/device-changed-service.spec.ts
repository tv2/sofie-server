import { DeviceChangedService } from './device-changed-service'
import { anything, capture, instance, mock, when } from '@typestrong/ts-mockito'
import { DataChangedListener } from '../../../cross-cutting-concerns/application/interfaces/data-changed-listener'
import { Logger } from '../../../cross-cutting-concerns/application/interfaces/logger'
import { StatusMessageService } from '../../../cross-cutting-concerns/application/interfaces/status-message-service'
import { StatusCode } from '../../../cross-cutting-concerns/domain/enums/status-code'
import { DeviceRepository } from '../../domain/repositories/device-repository'
import { EntityTestFactory } from '../../../rundown-execution/domain/entities/test/entity-test-factory'
import { CoreDevice } from '../../domain/entities/device'

const DEVICE_STATUS_MESSAGE_PREFIX: string = 'DEVICE_'

describe(DeviceChangedService.name, () => {
  it('calls the StatusMessageService with a StatusMessage that has the same id as the Device', async () => {
    const device: CoreDevice = EntityTestFactory.createCoreDevice({ id: 'deviceId' })
    const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
    await testee.initialize()

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.id).toBe(`${DEVICE_STATUS_MESSAGE_PREFIX}${device.id}`)
  })

  it('calls the StatusMessageService with a StatusMessage that has the Device name as title', async () => {
    const device: CoreDevice = EntityTestFactory.createCoreDevice({ statusMessage: 'some Message' })
    const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
    await testee.initialize()

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.message).toBe(device.statusMessage)
  })

  describe('the Device is not connected', () => {
    it('calls the StatusMessageService with a StatusCode BAD', async () => {
      const device: CoreDevice = EntityTestFactory.createCoreDevice({ isConnected: false, statusCode: StatusCode.UNKNOWN })
      const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
      await testee.initialize()

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(StatusCode.BAD)
    })

    it('calls the StatusMessageService with a NOT_CONNECTED message', async () => {
      const device: CoreDevice = EntityTestFactory.createCoreDevice({ isConnected: false, statusMessage: 'some message' })
      const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
      await testee.initialize()

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe('Not connected')
    })
  })

  describe('the Device is connected', () => {
    it('calls the StatusMessageService with a StatusMessage with a StatusCode matching the Device status', async () => {
      const device: CoreDevice = EntityTestFactory.createCoreDevice({ isConnected: true, statusCode: StatusCode.WARNING })
      const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
      await testee.initialize()

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(device.statusCode)
    })

    it('calls the StatusMessageService with a StatusMessage with a message matching the Device status message', async () => {
      const device: CoreDevice = EntityTestFactory.createCoreDevice({ isConnected: true, statusMessage: 'Some message' })
      const deviceDataChangedListener: DataChangedListener<CoreDevice> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      const testee: DeviceChangedService = createTestee({ statusMessageService, deviceDataChangedListener })
      await testee.initialize()

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe(device.statusMessage)
    })
  })
})

function createTestee(params?: {
  statusMessageService?: StatusMessageService
  deviceRepository?: DeviceRepository
  deviceDataChangedListener?: DataChangedListener<CoreDevice>
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
    instance(params?.deviceDataChangedListener ?? mock<DataChangedListener<CoreDevice>>()),
    instance(params?.logger ?? mock<Logger>())
  )
}

function createDeviceChangedListenerMock(device: CoreDevice): DataChangedListener<CoreDevice> {
  const deviceDataChangedListener: DataChangedListener<CoreDevice> = mock<DataChangedListener<CoreDevice>>()
  when(deviceDataChangedListener.onUpdated(anything())).thenCall(callback => callback(device))
  return deviceDataChangedListener
}
