import { DeviceConnectionServiceImplementation, DeviceConnectionStatus } from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { DeviceConnectionFactory } from '../interfaces/device-connection-factory'
import { instance, mock, verify } from '@typestrong/ts-mockito'


describe(DeviceConnectionServiceImplementation.name, () => {
  describe(DeviceConnectionServiceImplementation.prototype.createConnection.name, () => {
    it('should create a connected device', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = instance(mock<DeviceConnectionFactory>())
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      const deviceConnectionStatus: DeviceConnectionStatus = await testee.createConnection(device)

      expect(deviceConnectionStatus).toBe(DeviceConnectionStatus.CONNECTED)
      verify(testee.createConnection(device)).called()
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.connectionExists.name, () => {
    it('should return true for connection exists', () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice({isConnected: true})
      const factoryMock: DeviceConnectionFactory = instance(mock<DeviceConnectionFactory>())
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      const isConnected: boolean = testee.connectionExists(device.id)

      expect(isConnected).toBeTruthy()
      verify(testee.connectionExists(device.id)).called()
    })
  })
})

function createTestee(params?: {
  deviceConnectionFactory?: DeviceConnectionFactory
}): DeviceConnectionServiceImplementation {
  return new DeviceConnectionServiceImplementation(
    params?.deviceConnectionFactory ?? instance(mock<DeviceConnectionFactory>())
  )
}
