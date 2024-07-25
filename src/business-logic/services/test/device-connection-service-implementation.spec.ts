import { DeviceConnectionServiceImplementation, DeviceConnectionStatus } from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { DeviceConnectionFactory } from '../interfaces/device-connection-factory'
import { instance, mock, verify } from '@typestrong/ts-mockito'
import { INewsGatewayParams } from '../interfaces/inewsgateway-device-connection'

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

  describe(DeviceConnectionServiceImplementation.prototype.send.name, () => {
    it('should send a message to the correct device', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = instance(mock<DeviceConnectionFactory>())
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      const paramsList: INewsGatewayParams =  { content: 'Some message' }
      await testee.send(device.id, paramsList)

      verify(testee.createConnection(device)).called()

    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.listen.name, () => {
    it('should listen to the correct device', async () => {

    })

    it('should throw an error if the device is not connected', async () => {

    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectionStatusById.name, () => {
    it('should get a connection status for the given device', async () => {

    })

    it('should throw an error if the device is not in the collection', async () => {})

  })

  describe(DeviceConnectionServiceImplementation.prototype.disconnectConnectionById.name, () => {
    it('should disconnect the given device', async () => {

    })

    it('should throw an error if the given error is not connected', async () => {

    })    
  })

  describe(DeviceConnectionServiceImplementation.prototype.removeConnectionById.name, () => {
    it('should remove a connection for the given device id', async () => {

    })

    it('should throw an error if the device is not in the collection', async () => {})

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

  describe(DeviceConnectionServiceImplementation.prototype.listAllNetworkedDevices.name, () => {
    it('should retrieve a list of connected devices', async () => {

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
