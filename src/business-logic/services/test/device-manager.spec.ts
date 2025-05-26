import { DeviceManager } from '../device-manager'
import {
  DeviceConfigurationRepository
} from '../../../data-access/repositories/interfaces/device-configuration-repository'
import { anything, instance, mock, resetCalls, verify, when } from '@typestrong/ts-mockito'
import { DeviceEventEmitter } from '../interfaces/device-event-emitter'
import { DeviceFactory } from '../device-factory'
import { DeviceService } from '../interfaces/device-service'
import { DeviceConfiguration } from '../../../model/entities/device-configuration'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Device } from '../../../model/entities/devices/device'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

describe(DeviceManager.name, () => {
  describe(DeviceManager.prototype.create.name, () => {
    let deviceConfiguration: DeviceConfiguration
    let deviceConfigurationRepository: DeviceConfigurationRepository
    let deviceEventEmitter: DeviceEventEmitter

    beforeEach(() => {
      deviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      deviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.create(deviceConfiguration)).thenReturn(Promise.resolve(deviceConfiguration))

      deviceEventEmitter = mock<DeviceEventEmitter>()
    })

    it('saves the DeviceConfiguration', async () => {
      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceEventEmitter, deviceFactory: createDeviceFactory([deviceConfiguration]) })
      await testee.create(deviceConfiguration)

      verify(deviceConfigurationRepository.create(deviceConfiguration)).once()
    })

    it('emits a DeviceCreatedEvent', async () => {
      const device: Device = instance(mock(Device))
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(device)

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceEventEmitter, deviceFactory })
      await testee.create(deviceConfiguration)

      verify(deviceEventEmitter.emitDeviceCreatedEvent(device)).once()
    })

    it('connects to the Device', async () => {
      const device: Device = mock(Device)
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(device))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceEventEmitter, deviceFactory })
      await testee.create(deviceConfiguration)

      verify(device.connect()).once()
    })
  })

  describe(DeviceManager.prototype.update.name, () => {
    it('saves the updated DeviceConfiguration', async () => {
      const updatedDeviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory: createDeviceFactory([updatedDeviceConfiguration]) })
      await testee.update(updatedDeviceConfiguration)

      verify(deviceConfigurationRepository.update(updatedDeviceConfiguration)).once()
    })

    it('disconnects from the already existing Device', async () => {
      const deviceId: string = 'deviceId'
      const existingDeviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()

      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.getDeviceConfigurations()).thenReturn(Promise.resolve([existingDeviceConfiguration]))

      const existingDevice: Device = mock(Device)
      when(existingDevice.getId()).thenReturn(deviceId)

      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(anything(), anything())).thenReturn(instance(mock(Device)))
      when(deviceFactory.createDevice(existingDeviceConfiguration, anything())).thenReturn(instance(existingDevice))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory })
      await testee.initialize()

      await testee.update(EntityTestFactory.createDeviceConfiguration({ id: deviceId }))

      verify(existingDevice.disconnect()).once()
    })

    it('replaces the existing Device with the updated Device', async () => {
      const deviceId: string = 'deviceId'
      const existingDeviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration({ id: deviceId, name: 'existing' })

      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.getDeviceConfigurations()).thenReturn(Promise.resolve([existingDeviceConfiguration]))

      const existingDevice: Device = mock(Device)
      when(existingDevice.getId()).thenReturn(deviceId)
      when(existingDevice.getConfiguration()).thenReturn(existingDeviceConfiguration)

      const updatedDeviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration({ id: deviceId, name: 'updated' })
      const updatedDevice: Device = mock(Device)
      when(updatedDevice.getId()).thenReturn(deviceId)
      when(updatedDevice.getConfiguration()).thenReturn(updatedDeviceConfiguration)

      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(existingDeviceConfiguration, anything())).thenReturn(instance(existingDevice))
      when(deviceFactory.createDevice(updatedDeviceConfiguration, anything())).thenReturn(instance(updatedDevice))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory })
      await testee.initialize()

      const devicesBefore: Device[] = testee.getDevices()
      expect(devicesBefore).toHaveLength(1)
      expect(devicesBefore[0].getConfiguration().name).toBe(existingDeviceConfiguration.name)

      await testee.update(updatedDeviceConfiguration)

      const devicesAfter: Device[] = testee.getDevices()
      expect(devicesAfter).toHaveLength(1)
      expect(devicesAfter[0].getConfiguration().name).toBe(updatedDeviceConfiguration.name)
    })

    it('emits an UpdatedDeviceEvent', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const device: Device = instance(mock(Device))
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(device)

      const deviceEventEmitter: DeviceEventEmitter = mock<DeviceEventEmitter>()

      const testee: DeviceService = createTestee({ deviceEventEmitter, deviceFactory })
      await testee.update(deviceConfiguration)

      verify(deviceEventEmitter.emitDeviceUpdatedEvent(device)).once()
    })

    it('connects to the updated Device', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const device: Device = mock(Device)
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(device))

      const testee: DeviceService = createTestee({ deviceFactory })
      await testee.update(deviceConfiguration)

      verify(device.connect()).once()
    })
  })


  describe(DeviceManager.prototype.delete.name, () => {
    it('deletes the DeviceConfiguration', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()

      const testee: DeviceService = createTestee({ deviceConfigurationRepository })

      await testee.delete(deviceConfiguration.id)

      verify(deviceConfigurationRepository.delete(deviceConfiguration.id)).once()
    })

    it('disconnects from the Device', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.getDeviceConfigurations()).thenReturn(Promise.resolve([deviceConfiguration]))

      const device: Device = mock(Device)
      when(device.getId()).thenReturn(deviceConfiguration.id)
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(device))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory })
      await testee.initialize()

      await testee.delete(deviceConfiguration.id)

      verify(device.disconnect()).once()
    })

    it('removes the Device', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.getDeviceConfigurations()).thenReturn(Promise.resolve([deviceConfiguration]))

      const device: Device = mock(Device)
      when(device.getId()).thenReturn(deviceConfiguration.id)
      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(device))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory })
      await testee.initialize()

      expect(testee.getDevices()).toHaveLength(1)

      await testee.delete(deviceConfiguration.id)

      expect(testee.getDevices()).toHaveLength(0)
    })

    it('emits a DeviceDeletedEvent', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceEventEmitter: DeviceEventEmitter = mock<DeviceEventEmitter>()

      const testee: DeviceService = createTestee({ deviceEventEmitter })

      await testee.delete(deviceConfiguration.id)

      verify(deviceEventEmitter.emitDeviceDeletedEvent(deviceConfiguration.id)).once()
    })
  })

  describe(DeviceManager.prototype.reconnect.name, () => {
    describe('it does not have a Device for the parsed id', () => {
      it('throws a NotFoundException', () => {
        const nonExistingDeviceId: string = 'nonExistingDeviceId'
        const testee: DeviceService = createTestee()
        expect(() => testee.reconnect(nonExistingDeviceId)).toThrow(NotFoundException)
      })
    })

    it('reconnects the device', async () => {
      const deviceConfiguration: DeviceConfiguration = EntityTestFactory.createDeviceConfiguration()
      const deviceConfigurationRepository: DeviceConfigurationRepository = mock<DeviceConfigurationRepository>()
      when(deviceConfigurationRepository.getDeviceConfigurations()).thenReturn(Promise.resolve([deviceConfiguration]))

      const device: Device = mock(Device)
      when(device.getId()).thenReturn(deviceConfiguration.id)

      const deviceFactory: DeviceFactory = mock(DeviceFactory)
      when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(device))

      const testee: DeviceService = createTestee({ deviceConfigurationRepository, deviceFactory })
      await testee.initialize()
      resetCalls(device)

      testee.reconnect(deviceConfiguration.id)

      verify(device.disconnect()).calledBefore(device.connect())
    })
  })
})

function createTestee(params?: {
  deviceConfigurationRepository?: DeviceConfigurationRepository,
  deviceEventEmitter?: DeviceEventEmitter,
  deviceFactory?: DeviceFactory
}): DeviceService {
  return new DeviceManager(
    instance(params?.deviceConfigurationRepository ?? mock<DeviceConfigurationRepository>()),
    instance(params?.deviceEventEmitter ?? mock<DeviceEventEmitter>()),
    instance(params?.deviceFactory ?? mock(DeviceFactory))
  )
}

function createDeviceFactory(deviceConfigurations: DeviceConfiguration[]): DeviceFactory {
  const deviceFactory: DeviceFactory = mock(DeviceFactory)
  deviceConfigurations.forEach(deviceConfiguration => {
    when(deviceFactory.createDevice(deviceConfiguration, anything())).thenReturn(instance(mock(Device)))
  })
  return deviceFactory
}
