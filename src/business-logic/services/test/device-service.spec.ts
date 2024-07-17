import { DeviceServiceImplementation } from '../device-service-implementation'
import { Device } from '../../../model/entities/device'
import { instance, mock, verify, when } from '@typestrong/ts-mockito'
import { DeviceEventEmitter } from '../interfaces/device-event-emitter'
import { DeviceRepository } from '../../../data-access/repositories/interfaces/device-repository'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'

describe(DeviceServiceImplementation.name, () => {
  describe(DeviceServiceImplementation.prototype.getDevices.name, () => {
    it('should get all devices', async () => {
      const devices: Device[] = [EntityTestFactory.createDevice()]
      const deviceRepository: DeviceRepository = mock<DeviceRepository>()
      when(deviceRepository.getDevices()).thenReturn(Promise.resolve(devices))
      const testee: DeviceServiceImplementation = new DeviceServiceImplementation(instance(deviceRepository), instance(mock<DeviceEventEmitter>()))

      const result: Device[] = await testee.getDevices()

      expect(result).toEqual(devices)
    })
  })

  describe(DeviceServiceImplementation.prototype.getDevice.name, () => {
    it('should get one specific device', async () => {
      const deviceToBeFetched: Device = EntityTestFactory.createDevice({id: 'new-device'})
      const deviceRepository: DeviceRepository = mock<DeviceRepository>()
      when(deviceRepository.getDevice(deviceToBeFetched.id)).thenReturn(Promise.resolve(deviceToBeFetched))
      const testee: DeviceServiceImplementation = createTestee({deviceRepository: instance(deviceRepository)})

      const result: Device = await testee.getDevice(deviceToBeFetched.id)

      expect(result).toEqual(deviceToBeFetched)
    })
  })

  describe(DeviceServiceImplementation.prototype.create.name, () => {
    it('should create a new device', async () => {
      const deviceToBeCreated: Device = EntityTestFactory.createDevice({id: 'new-device'})
      const deviceRepository: DeviceRepository = mock<DeviceRepository>()
      when(deviceRepository.save(deviceToBeCreated))
      const testee: DeviceServiceImplementation = createTestee({deviceRepository: instance(deviceRepository)})

      await testee.create(deviceToBeCreated)

      verify(deviceRepository.save(deviceToBeCreated)).called()
    })

    it('should emit a DeviceCreatedEvent', async () => {
      const deviceToBeCreated: Device = EntityTestFactory.createDevice({id: 'new-device'})
      const deviceEventEmitter: DeviceEventEmitter = mock<DeviceEventEmitter>()
      const testee: DeviceServiceImplementation = createTestee({deviceEventEmitter: instance(deviceEventEmitter)})

      await testee.create(deviceToBeCreated)

      verify(deviceEventEmitter.emitDeviceCreatedEvent(deviceToBeCreated)).once()
    })
  })
})

function createTestee(params?: {
  deviceRepository?: DeviceRepository,
  deviceEventEmitter?: DeviceEventEmitter
}): DeviceServiceImplementation {
  return new DeviceServiceImplementation(
    params?.deviceRepository ?? instance(mock<DeviceRepository>()),
    params?.deviceEventEmitter ?? mock<DeviceEventEmitter>(),
  )
}


