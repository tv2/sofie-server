import {DeviceConnectionServiceImplementation} from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import {EntityTestFactory} from '../../../model/entities/test/entity-test-factory'
import {DeviceConnectionFactory} from '../interfaces/device-connection-factory'
import {anyFunction, capture, instance, mock, verify, when} from '@typestrong/ts-mockito'
import {INewsGatewayDeviceConnection} from '../inews-gateway-connection-implementation'
import {DeviceConnectionStatus} from '../../../model/enums/device-connection-status'
import {DeviceService} from '../interfaces/device-service'
import {DeviceNotFoundException} from '../../../model/exceptions/device-not-found-exception'
import {DeviceType} from '../../../model/enums/device-type'
import {Logger} from '../../../logger/logger'

type CallbackType = (data: unknown) => void

describe(DeviceConnectionServiceImplementation.name, () => {
  describe(DeviceConnectionServiceImplementation.prototype.createConnection.name, () => {
    describe('when the device is not connected', () => {
      it('should create a connected device', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        expect(await testee.createConnection(iNewsDevice)).resolves

        verify(factoryMock.createDeviceConnection(iNewsDevice)).called()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.send.name, () => {
    describe('when the device is connected', () => {
      it('should send a message', async () => {
        const iNewsGatewayDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsGatewayDevice]
        const paramsList:string[] = [ 'Some message']
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device)
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.send(iNewsGatewayDevice.id, paramsList)).thenResolve()
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsGatewayDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(iNewsGatewayDevice)
        await testee.send(iNewsGatewayDevice.id, paramsList)

        verify(factoryMock.createDeviceConnection(iNewsGatewayDevice)).called()
        verify(deviceConnection.send(iNewsGatewayDevice.id, paramsList)).called()
      })
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you send a message', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const paramsList:string[] = [ 'Some message']
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device)
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.send(iNewsDevice.id, paramsList)).thenResolve()
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await expect(testee.send(iNewsDevice.id, (iNewsDevice.id, paramsList))).rejects.toThrow(`Device with ID '${iNewsDevice.id}' is not in the collection. Have you forgot to create the connection?`)

        verify(deviceConnection.listen(iNewsDevice.id, anyFunction())).never()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.listen.name, () => {
    describe('when the device is connected', () => {
      it('should listen to the correct device', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        const mockCallback: jest.Mock<CallbackType> = jest.fn()
        when(deviceConnection.listen(iNewsDevice.id, anyFunction())).thenResolve()
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(iNewsDevice)
        await testee.listen(iNewsDevice.id, mockCallback)

        verify(factoryMock.createDeviceConnection(iNewsDevice)).called()
        verify(deviceConnection.listen(iNewsDevice.id, anyFunction())).called()
        const capturedCallback: (arg: unknown) => void = capture(deviceConnection.listen).last()[1]
        capturedCallback('sample data')
        expect(mockCallback).toHaveBeenCalledWith('sample data')
      })
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you listen', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        const mockCallback: jest.Mock<CallbackType> = jest.fn()
        when(deviceConnection.listen(iNewsDevice.id, anyFunction())).thenResolve()
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await expect(testee.listen(iNewsDevice.id, mockCallback)).rejects.toThrow(`Device with ID '${iNewsDevice.id}' is not in the collection. Have you forgot to create the connection?`)

        verify(deviceConnection.listen(iNewsDevice.id, anyFunction())).never()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectionStatusById.name, () => {
    describe('when the device is connected', () => {
      it('should get a connection status device connected', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ id: 'test-case-id-01', type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(iNewsDevice)
        const statusRetrievedAfterCreation: DeviceConnectionStatus = testee.getConnectionStatusById(iNewsDevice.id)

        expect(statusRetrievedAfterCreation).toBe(DeviceConnectionStatus.CONNECTED)
      })
    })

    describe('when the device is not connected', () => {
      it('should return connection status device disconnected', () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        const statusRetrievedAfterCreation: DeviceConnectionStatus = testee.getConnectionStatusById(iNewsDevice.id)

        expect(statusRetrievedAfterCreation).toBe(DeviceConnectionStatus.DISCONNECTED)
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.disconnectConnectionById.name, () => {
    describe('when the device is connected', () => {
      it('should disconnect the given device', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(iNewsDevice)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(iNewsDevice)
        expect(await testee.disconnectConnectionById(iNewsDevice.id)).resolves
      })
    })

    describe('when the device is not connected', () => {
      it('should return DeviceConnectionStatus.DISCONNECTED', async () => {
        const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [device]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        expect(await testee.disconnectConnectionById(device.id)).resolves
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.removeConnectionById.name, () => {
    describe('when the device is connected', () => {
      it('should remove the connection', async () => {
        const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [device]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(device)
        expect(await testee.removeConnectionById(device.id)).resolves
      })
    })

    describe('when the device is not connected', () => {
      it('should throw a DeviceAlreadyRemovedError', async () => {
        const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [device]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await expect(testee.removeConnectionById(device.id)).rejects.toThrow(DeviceNotFoundException)
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.connectionExists.name, () => {
    describe('when the device is connected', () => {
      it('should return true', async () => {
        const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [device]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        await testee.createConnection(device)
        const isConnected: boolean = testee.connectionExists(device.id)

        expect(isConnected).toBeTruthy()
      })
    })

    describe('when the device is not connected', () => {
      it('should return false', () => {
        const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [device]
        const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const deviceServiceMock: DeviceService = mock<DeviceService>()
        when(deviceConnection.connect()).thenResolve(true)
        when(deviceServiceMock.getDevices()).thenResolve(devices)
        when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

        const isConnected: boolean = testee.connectionExists(device.id)

        expect(isConnected).toBeFalsy()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectedDevices.name, () => {
    it('should retrieve a list of connected devices', async () => {
      const device: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
      const devices: Device[] = [device]
      const factoryMock: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const deviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      const deviceServiceMock: DeviceService = mock<DeviceService>()
      when(deviceConnection.connect()).thenResolve(true)
      when(deviceServiceMock.getDevices()).thenResolve(devices)
      when(factoryMock.createDeviceConnection(device)).thenReturn(instance(deviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: factoryMock, deviceService: deviceServiceMock })

      await testee.createConnection(device)
      const connectedDevices: Device[] = testee.getConnectedDevices()

      expect(connectedDevices.length).toBeGreaterThan(0)
    })
  })
})

function createTestee(params?: {
  deviceConnectionFactory?: DeviceConnectionFactory,
  deviceService?: DeviceService
}): DeviceConnectionServiceImplementation {
  const factory: DeviceConnectionFactory = instance(params?.deviceConnectionFactory ?? mock<DeviceConnectionFactory>())
  const mockLogger: Logger = instance(mock<Logger>())
  const service: DeviceService = instance(params?.deviceService ?? mock<DeviceService>())

  return new DeviceConnectionServiceImplementation(
    mockLogger,
    factory,
    service
  )
}
