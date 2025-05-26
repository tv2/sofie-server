import { DeviceChangedService } from '../device-changed-service'
import { anything, capture, instance, mock, when } from '@typestrong/ts-mockito'
import { DataChangedListener } from '../../../data-access/repositories/interfaces/data-changed-listener'
import { Logger } from '../../../logger/logger'
import { StatusMessageService } from '../interfaces/status-message-service'
import { StatusCode } from '../../../model/enums/status-code'
import { CoreDeviceConfiguration } from '../../../model/entities/device-configuration'
import { DeviceConfigurationRepository } from '../../../data-access/repositories/interfaces/device-configuration-repository'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'

const DEVICE_STATUS_MESSAGE_PREFIX: string = 'DEVICE_'

describe(DeviceChangedService.name, () => {
  it('calls the StatusMessageService with a StatusMessage that has the same id as the Device', () => {
    const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({id: 'deviceId'})
    const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
    createTestee({statusMessageService, deviceDataChangedListener})

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.id).toBe(`${DEVICE_STATUS_MESSAGE_PREFIX}${device.id}`)
  })

  it('calls the StatusMessageService with a StatusMessage that has the Device name as title', () => {
    const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({statusMessage: 'some Message'})
    const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

    const statusMessageService: StatusMessageService = mock<StatusMessageService>()

    // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
    createTestee({statusMessageService, deviceDataChangedListener})

    const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
    expect(statusMessage.message).toBe(device.statusMessage)
  })

  describe('the Device is not connected', () => {
    it('calls the StatusMessageService with a StatusCode BAD', () => {
      const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({isConnected: false, statusCode: StatusCode.UNKNOWN})
      const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({statusMessageService, deviceDataChangedListener})

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(StatusCode.BAD)
    })

    it('calls the StatusMessageService with a NOT_CONNECTED message', () => {
      const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({isConnected: false, statusMessage: 'some message'})
      const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({statusMessageService, deviceDataChangedListener})

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe('Not connected')
    })
  })

  describe('the Device is connected', () => {
    it('calls the StatusMessageService with a StatusMessage with a StatusCode matching the Device status', () => {
      const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({isConnected: true, statusCode: StatusCode.WARNING})
      const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({statusMessageService, deviceDataChangedListener})

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.statusCode).toBe(device.statusCode)
    })

    it('calls the StatusMessageService with a StatusMessage with a message matching the Device status message', () => {
      const device: CoreDeviceConfiguration = EntityTestFactory.createCoreDeviceConfiguration({isConnected: true, statusMessage: 'Some message'})
      const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = createDeviceChangedListenerMock(device)

      const statusMessageService: StatusMessageService = mock<StatusMessageService>()

      // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
      createTestee({statusMessageService, deviceDataChangedListener})

      const [statusMessage] = capture(statusMessageService.updateStatusMessage).last()
      expect(statusMessage.message).toBe(device.statusMessage)
    })
  })
})

function createTestee(params?: {
  statusMessageService?: StatusMessageService,
  deviceRepository?: DeviceConfigurationRepository,
  deviceDataChangedListener?: DataChangedListener<CoreDeviceConfiguration>,
  logger?: Logger
}): DeviceChangedService {
  let deviceRepository: DeviceConfigurationRepository
  if (!params?.deviceRepository) {
    const deviceRepositoryMock: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
    when(deviceRepositoryMock.getDeviceConfigurations()).thenReturn(Promise.resolve([]))
    deviceRepository = deviceRepositoryMock
  } else {
    deviceRepository = params.deviceRepository
  }

  return new DeviceChangedService(
    instance(params?.statusMessageService ?? mock<StatusMessageService>()),
    instance(deviceRepository),
    instance(params?.deviceDataChangedListener ?? mock<DataChangedListener<CoreDeviceConfiguration>>()),
    instance(params?.logger ?? mock<Logger>())
  )
}

function createDeviceChangedListenerMock(device: CoreDeviceConfiguration): DataChangedListener<CoreDeviceConfiguration> {
  const deviceDataChangedListener: DataChangedListener<CoreDeviceConfiguration> = mock<DataChangedListener<CoreDeviceConfiguration>>()
  when(deviceDataChangedListener.onUpdated(anything())).thenCall(callback => callback(device))
  return deviceDataChangedListener
}
