import { DeviceConnectionServiceImplementation, DeviceConnectionStatus } from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { DeviceConnectionFactory } from '../interfaces/device-connection-factory'
import { instance, mock, verify, when, capture, anyFunction } from '@typestrong/ts-mockito'
import { INewsGatewayDeviceConnection } from '../inews-gateway-connection-implementation'

type CallbackType = (data: unknown) => void

describe(DeviceConnectionServiceImplementation.name, () => {
  describe(DeviceConnectionServiceImplementation.prototype.createConnection.name, () => {
    it('should create a connected device', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      when(deviceConnection.connect()).thenResolve(true) 
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      const deviceConnectionStatus: DeviceConnectionStatus = await testee.createConnection(device)

      expect(deviceConnectionStatus).toBe(DeviceConnectionStatus.CONNECTED)
      verify(factoryMock.createDeviceConnection(device)).called()
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.send.name, () => {
    it('should send a message to the correct device', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const paramsList:string[] = [ 'Some message']
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device) 
      when(deviceConnection.send(device.id, paramsList)).thenResolve()
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await testee.createConnection(device)
      await testee.send(device.id, paramsList)

      verify(factoryMock.createDeviceConnection(device)).called()
      verify(deviceConnection.send(device.id, paramsList)).called()
    })

    it('should throw an error if the device is not connected', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const paramsList:string[] = [ 'Some message']
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device) 
      when(deviceConnection.send(device.id, paramsList)).thenResolve()
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await expect(testee.send(device.id, (device.id, paramsList))).rejects.toThrow(`Device with ID '${device.id}' is not in the collection. Have you forgot to create the connection?`)
      
      verify(deviceConnection.listen(device.id, anyFunction())).never()
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.listen.name, () => {
    it('should listen to the correct device', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      const mockCallback: jest.Mock<CallbackType> = jest.fn()
      when(deviceConnection.listen(device.id, anyFunction())).thenResolve()
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await testee.createConnection(device)
      await testee.listen(device.id, mockCallback)

      verify(factoryMock.createDeviceConnection(device)).called()
      verify(deviceConnection.listen(device.id, anyFunction())).called()

      const capturedCallback: (arg: unknown) => void = capture(deviceConnection.listen).last()[1]
      capturedCallback('sample data')
      expect(mockCallback).toHaveBeenCalledWith('sample data')
    })

    it('should throw an error if the device is not connected', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      const mockCallback: jest.Mock<CallbackType> = jest.fn()
      when(deviceConnection.listen(device.id, anyFunction())).thenResolve()
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await expect(testee.listen(device.id, mockCallback)).rejects.toThrow(`Device with ID '${device.id}' is not in the collection. Have you forgot to create the connection?`)
      
      verify(deviceConnection.listen(device.id, anyFunction())).never()
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectionStatusById.name, () => {
    it('should get a connection status for the given device', async () => {

    })

    it('should throw an error if the device is not in the collection', async () => {

    })

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
    it('should return true for connection exists', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      when(deviceConnection.connect()).thenResolve(true) 
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await testee.createConnection(device)
      const isConnected: boolean = testee.connectionExists(device.id)

      expect(isConnected).toBeTruthy()
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.listAllNetworkedDevices.name, () => {
    it('should retrieve a list of connected devices', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      when(deviceConnection.connect()).thenResolve(true) 
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await testee.createConnection(device)
      const devices: Device[] = testee.listAllNetworkedDevices()

      expect(devices.length).toBeGreaterThan(0)
    })
  })
})

function createTestee(params?: {
  deviceConnectionFactory?: DeviceConnectionFactory
}): DeviceConnectionServiceImplementation {
  return new DeviceConnectionServiceImplementation(
    instance(params?.deviceConnectionFactory ?? mock<DeviceConnectionFactory>())
  )
}
