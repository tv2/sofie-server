import { DeviceConnectionServiceImplementation, DeviceConnectionStatus } from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { DeviceConnectionFactory } from '../interfaces/device-connection-factory'
import { instance, mock, verify, when, capture, anyFunction } from '@typestrong/ts-mockito'
import { INewsGatewayDeviceConnection } from '../inews-gateway-connection-implementation'

type CallbackType = (data: unknown) => void

describe(DeviceConnectionServiceImplementation.name, () => {
  describe(DeviceConnectionServiceImplementation.prototype.createConnection.name, () => {
    describe('when the device is not connected', () => {
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

  })

  describe(DeviceConnectionServiceImplementation.prototype.send.name, () => {
    describe('when the device is connected', () => {
      it('should send a message', async () => {
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
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you send a message', async () => {
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
  })

  describe(DeviceConnectionServiceImplementation.prototype.listen.name, () => {
    describe('when the device is connected', () => {
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
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you listen', async () => {
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
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectionStatusById.name, () => {
    describe('when the device is connected', () => {
      it('should get a connection status device connected', async () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice({ id: 'test-case-id-01' })
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
        
        await testee.createConnection(device)
        const statusRetrievedAfterCreation: DeviceConnectionStatus = testee.getConnectionStatusById(device.id)
  
        expect(statusRetrievedAfterCreation).toBe(DeviceConnectionStatus.CONNECTED)
      })
    })

    describe('when the device is not connected', () => {
      it('should return connection status device disconnected', () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        const statusRetrievedAfterCreation: DeviceConnectionStatus = testee.getConnectionStatusById(device.id)

        expect(statusRetrievedAfterCreation).toBe(DeviceConnectionStatus.DISCONNECTED)
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.disconnectConnectionById.name, () => {
    describe('when the device is connected', () => {
      it('should disconnect the given device', async () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        await testee.createConnection(device)
        const connectionStatus: DeviceConnectionStatus = await testee.disconnectConnectionById(device.id)

        expect(connectionStatus).toBe(DeviceConnectionStatus.DISCONNECTED)
      })
    })

    describe('when the device is not connected', () => {
      it('should return DeviceConnectionStatus.DISCONNECTED', async () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        const connectionStatus: DeviceConnectionStatus = await testee.disconnectConnectionById(device.id)

        expect(connectionStatus).toBe(DeviceConnectionStatus.DISCONNECTED)
      })    
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.removeConnectionById.name, () => {
    describe('when the device is connected', () => {
      it('should remove the connection', async () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        await testee.createConnection(device)
        const connectionStatus: DeviceConnectionStatus = await testee.removeConnectionById(device.id)

        expect(connectionStatus).toBe(DeviceConnectionStatus.DISCONNECTED)
      })
    })

    describe('when the device is not connected', () => {
      it('should throw a DeviceAlreadyRemovedError', async () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        when(deviceConnection.connect()).thenResolve(true) 
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        await expect(testee.removeConnectionById(device.id)).rejects.toThrow(`Device with ID '${device.id}' is already removed.`)
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.connectionExists.name, () => {
    describe('when the device is connected', () => {
      it('should return true', async () => {
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

    describe('when the device is not connected', () => {
      it('should return false', () => {
        const device: Device = EntityTestFactory.createINewsGatewayDevice()
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
        const isConnected: boolean = testee.connectionExists(device.id)

        expect(isConnected).toBeFalsy()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectedDevices.name, () => {
    it('should retrieve a list of connected devices', async () => {
      const device: Device = EntityTestFactory.createINewsGatewayDevice()
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      when(deviceConnection.connect()).thenResolve(true) 
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock})
      
      await testee.createConnection(device)
      const devices: Device[] = testee.getConnectedDevices()

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
