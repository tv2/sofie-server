import { DeviceChangedService } from '../device-changed-service'
import { anything, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { StatusMessageEventEmitter } from '../interfaces/status-message-event-emitter'
import { StatusMessageRepository } from '../../../data-access/repositories/interfaces/status-message-repository'
import { DataChangedListener } from '../../../data-access/repositories/interfaces/data-changed-listener'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { StatusCode } from '../../../model/enums/status-code'
import { StatusMessage } from '../../../model/entities/status-message'
import { DeviceRepository } from '../../../data-access/repositories/interfaces/device-repository'
import { Logger } from '../../../logger/logger'

describe(DeviceChangedService.name, () => {
  describe('there are no StatusMessages for the Device', () => {
    describe('the Device is not connected', () => {
      it('creates a new Bad StatusMessage', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: false })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageEventEmitter: instance(statusMessageEventEmitter),
          statusMessageRepository: instance(statusMessageRepository),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        const [statusMessage] = capture(statusMessageEventEmitter.emitStatusMessageEvent).last()
        expect(statusMessage.statusCode).toBe(StatusCode.BAD)
        verify(statusMessageRepository.createStatusMessage(anything())).once()
      })
    })

    describe('the Device is connected', () => {
      it('does nothing when the Device status is GOOD', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.GOOD })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageEventEmitter: instance(statusMessageEventEmitter),
          statusMessageRepository: instance(statusMessageRepository),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        assertNoModifyMethodsCalled(statusMessageRepository)
        verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).never()
      })

      it('emits a StatusMessage event for the Device', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.BAD })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageEventEmitter: instance(statusMessageEventEmitter),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).once()
      })

      it('emits a StatusMessage event with values of the Device', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.BAD, statusMessage: 'Hello world' })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageEventEmitter: instance(statusMessageEventEmitter),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        const [emittedStatusMessage] = capture(statusMessageEventEmitter.emitStatusMessageEvent).last()
        assertStatusMessageIsFromDevice(emittedStatusMessage, device)
      })

      it('saves a new StatusMessage for the Device', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.BAD })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageRepository: instance(statusMessageRepository),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        verify(statusMessageRepository.createStatusMessage(anything())).once()
      })

      it('saves a new StatusMessage with the values for the Device', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.BAD, statusMessage: 'Hello world' })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageRepository: instance(statusMessageRepository),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        const [savedStatusMessage] = capture(statusMessageRepository.createStatusMessage).last()
        assertStatusMessageIsFromDevice(savedStatusMessage, device)
      })
    })
  })

  describe('there is a StatusMessage for the Device', () => {
    describe('the Device is not connected', () => {
      it('updates the StatusMessage to be BAD', async () => {
        const device: Device = EntityTestFactory.createDevice({ isConnected: false })
        const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

        const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
        const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()
        when(statusMessageRepository.getStatusMessage(device.id)).thenReturn(Promise.resolve(EntityTestFactory.createStatusMessage()))

        // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
        createTestee({
          statusMessageEventEmitter: instance(statusMessageEventEmitter),
          statusMessageRepository: instance(statusMessageRepository),
          deviceDataChangeListener: instance(deviceDataChangedListener)
        })

        await wait()

        const [statusMessage] = capture(statusMessageEventEmitter.emitStatusMessageEvent).last()
        expect(statusMessage.statusCode).toBe(StatusCode.BAD)
        verify(statusMessageRepository.updateStatusMessage(anything())).once()
      })
    })

    describe('the Device is connected', () => {
      describe('the saved StatusMessage is not different from the new Device', () => {
        it('does nothing', async () => {
          const device: Device = EntityTestFactory.createDevice({ isConnected: true })
          const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

          const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

          const statusMessageInDatabase: StatusMessage = createStatusMessageFromDevice(device)
          when(statusMessageRepository.getStatusMessage(device.id)).thenReturn(Promise.resolve(statusMessageInDatabase))

          // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
          createTestee({
            statusMessageEventEmitter: instance(statusMessageEventEmitter),
            statusMessageRepository: instance(statusMessageRepository),
            deviceDataChangeListener: instance(deviceDataChangedListener)
          })

          await wait()

          assertNoModifyMethodsCalled(statusMessageRepository)
          verify(statusMessageEventEmitter.emitStatusMessageEvent(anything())).never()
        })
      })

      describe('the saved StatusMessage is different from the new Device', () => {
        it('emits a new StatusMessage for the Device', async () => {
          const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.UNKNOWN })
          const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

          const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

          const statusMessageInDatabase: StatusMessage = EntityTestFactory.createStatusMessage({ id: 'differentStatusMessageId', title: 'different', statusCode: StatusCode.GOOD })
          when(statusMessageRepository.getStatusMessage(device.id)).thenReturn(Promise.resolve(statusMessageInDatabase))

          // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
          createTestee({
            statusMessageEventEmitter: instance(statusMessageEventEmitter),
            statusMessageRepository: instance(statusMessageRepository),
            deviceDataChangeListener: instance(deviceDataChangedListener)
          })

          await wait()

          const [emittedStatusMessage] = capture(statusMessageEventEmitter.emitStatusMessageEvent).last()
          expect(emittedStatusMessage).not.toBe(statusMessageInDatabase)
          assertStatusMessageIsFromDevice(emittedStatusMessage, device)
        })

        it('deletes the saved StatusMessage when the Device status is GOOD', async () => {
          const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.GOOD })
          const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

          const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
          const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

          const statusMessageInDatabase: StatusMessage = EntityTestFactory.createStatusMessage({ id: 'differentStatusMessageId', title: 'different', statusCode: StatusCode.UNKNOWN })
          when(statusMessageRepository.getStatusMessage(device.id)).thenReturn(Promise.resolve(statusMessageInDatabase))

          // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
          createTestee({
            statusMessageEventEmitter: instance(statusMessageEventEmitter),
            statusMessageRepository: instance(statusMessageRepository),
            deviceDataChangeListener: instance(deviceDataChangedListener)
          })

          await wait()

          verify(statusMessageRepository.deleteStatusMessage(statusMessageInDatabase.id)).once()
          verify(statusMessageRepository.updateStatusMessage(anything())).never()
        })

        describe('Device status is not GOOD or UNKNOWN', () => {
          it('updates the StatusMessage for the Device', async () => {
            const device: Device = EntityTestFactory.createDevice({ isConnected: true, statusCode: StatusCode.BAD })
            const deviceDataChangedListener: DataChangedListener<Device> = createDeviceChangedListenerMock(device)

            const statusMessageEventEmitter: StatusMessageEventEmitter = mock<StatusMessageEventEmitter>()
            const statusMessageRepository: StatusMessageRepository = mock<StatusMessageRepository>()

            const statusMessageInDatabase: StatusMessage = EntityTestFactory.createStatusMessage({ id: 'differentStatusMessageId', title: 'different', statusCode: StatusCode.UNKNOWN })
            when(statusMessageRepository.getStatusMessage(device.id)).thenReturn(Promise.resolve(statusMessageInDatabase))

            // This is our testee. The flow starts in the constructor, so we just need to instantiate it.
            createTestee({
              statusMessageEventEmitter: instance(statusMessageEventEmitter),
              statusMessageRepository: instance(statusMessageRepository),
              deviceDataChangeListener: instance(deviceDataChangedListener)
            })

            await wait()

            const [updatedStatusMessage] = capture(statusMessageRepository.updateStatusMessage).last()
            assertStatusMessageIsFromDevice(updatedStatusMessage, device)
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  statusMessageEventEmitter?: StatusMessageEventEmitter,
  statusMessageRepository?: StatusMessageRepository,
  deviceRepository?: DeviceRepository,
  deviceDataChangeListener?: DataChangedListener<Device>,
  logger?: Logger
}): DeviceChangedService {
  let deviceRepository: DeviceRepository
  if (!params?.deviceRepository) {
    const deviceRepositoryMock: DeviceRepository = mock<DeviceRepository>()
    when(deviceRepositoryMock.getDevices()).thenReturn(Promise.resolve([]))
    deviceRepository = instance(deviceRepositoryMock)
  } else {
    deviceRepository = params.deviceRepository
  }

  return new DeviceChangedService(
    params?.statusMessageEventEmitter ?? instance(mock<StatusMessageEventEmitter>()),
    params?.statusMessageRepository ?? instance(mock<StatusMessageRepository>()),
    deviceRepository,
    params?.deviceDataChangeListener ?? instance(mock<DataChangedListener<Device>>()),
    params?.logger ?? instance(mock<Logger>())
  )
}

function createDeviceChangedListenerMock(device: Device): DataChangedListener<Device> {
  const deviceDataChangedListener: DataChangedListener<Device> = mock<DataChangedListener<Device>>()
  when(deviceDataChangedListener.onUpdated(anything())).thenCall(callback => callback(device))
  return deviceDataChangedListener
}

function wait(): Promise<void> {
  return new Promise(f => setTimeout(f, 10))
}

function assertNoModifyMethodsCalled(statusMessageRepository: StatusMessageRepository): void {
  verify(statusMessageRepository.createStatusMessage(anything())).never()
  verify(statusMessageRepository.updateStatusMessage(anything())).never()
  verify(statusMessageRepository.deleteStatusMessage(anything())).never()
}

function assertStatusMessageIsFromDevice(emittedStatusMessage: StatusMessage, device: Device): void {
  const statusMessageFromDevice: StatusMessage = createStatusMessageFromDevice(device)
  expect(emittedStatusMessage.id).toBe(statusMessageFromDevice.id)
  expect(emittedStatusMessage.statusCode).toBe(statusMessageFromDevice.statusCode)
  expect(emittedStatusMessage.title).toBe(statusMessageFromDevice.title)
  expect(emittedStatusMessage.message).toBe(statusMessageFromDevice.message)
}

function createStatusMessageFromDevice(device: Device): StatusMessage {
  return {
    id: device.id,
    title: device.name,
    statusCode: device.statusCode,
    message: device.statusMessage
  }
}
