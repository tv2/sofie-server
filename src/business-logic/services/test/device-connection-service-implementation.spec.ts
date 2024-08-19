import { DeviceConnectionServiceImplementation } from '../device-connection-service-implementation'
import { Device } from '../../../model/entities/device'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { DeviceConnectionFactory } from '../interfaces/device-connection-factory'
import { anyFunction, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { INewsGatewayDeviceConnection } from '../inews-gateway-connection-implementation'
import { DeviceConnectionStatus } from '../../../model/enums/device-connection-status'
import { DeviceService } from '../interfaces/device-service'
import { DeviceNotFoundException } from '../../../model/exceptions/device-not-found-exception'
import { DeviceType } from '../../../model/enums/device-type'
import { Logger } from '../../../logger/logger'
import { DummyLogger } from '../../../logger/dummy-logger'

type CallbackType = (data: unknown) => void

describe(DeviceConnectionServiceImplementation.name, () => {
  describe(DeviceConnectionServiceImplementation.prototype.init.name, () => {
    describe('when the device is not connected', () => {
      it('should create a connected device', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()

        verify(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).called()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.send.name, () => {
    describe('when the device is connected', () => {
      it('should send a message', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const paramsList:string[] = [ 'Some message']
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device)
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.send(iNewsDevice.id, paramsList)).thenResolve()
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        await testee.send(iNewsDevice.id, paramsList)

        verify(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).called()
        verify(mockedDeviceConnection.send(iNewsDevice.id, paramsList)).called()
      })
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you send a message', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = []
        const paramsList:string[] = [ 'Some message']
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>() //new INewsGatewayDeviceConnection(device)
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        await expect(testee.send(iNewsDevice.id, paramsList)).rejects.toThrow(DeviceNotFoundException)

        verify(mockedDeviceConnection.listen(iNewsDevice.id, anyFunction())).never()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.listen.name, () => {
    describe('when the device is connected', () => {
      it('should listen to the correct device', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        const mockCallback: jest.Mock<CallbackType> = jest.fn()
        when(mockedDeviceConnection.listen(iNewsDevice.id, anyFunction())).thenResolve()
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        await testee.listen(iNewsDevice.id, mockCallback)

        verify(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).called()
        verify(mockedDeviceConnection.listen(iNewsDevice.id, anyFunction())).called()
        const capturedCallback: (arg: unknown) => void = capture(mockedDeviceConnection.listen).last()[1]
        capturedCallback('sample data')
        expect(mockCallback).toHaveBeenCalledWith('sample data')
      })
    })

    describe('when the device is not connected', () => {
      it('should throw an error when you listen', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = []
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        const mockCallback: jest.Mock<CallbackType> = jest.fn()
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        await expect(testee.listen(iNewsDevice.id, mockCallback)).rejects.toThrow()

        verify(mockedDeviceConnection.listen(iNewsDevice.id, anyFunction())).never()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectionStatusById.name, () => {
    describe('when the device is connected', () => {
      it('should get a connection status device connected', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ id: 'test-case-id-01', type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        const statusRetrievedAfterCreation: DeviceConnectionStatus = testee.getConnectionStatusById(iNewsDevice.id)

        expect(statusRetrievedAfterCreation).toBe(DeviceConnectionStatus.CONNECTED)
      })
    })

    describe('when the device is not connected', () => {
      it('should return connection status device disconnected', () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

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
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        expect(await testee.disconnectConnectionById(iNewsDevice.id)).resolves
      })
    })

    describe('when the device is not connected', () => {
      it('should return DeviceConnectionStatus.DISCONNECTED', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        expect(await testee.disconnectConnectionById(iNewsDevice.id)).resolves
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.removeConnectionById.name, () => {
    describe('when the device is connected', () => {
      it('should remove the connection', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        expect(await testee.removeConnectionById(iNewsDevice.id)).resolves
      })
    })

    describe('when the device is not connected', () => {
      it('should throw a DeviceNotFoundException', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        await expect(testee.removeConnectionById(iNewsDevice.id)).rejects.toThrow(DeviceNotFoundException)
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.connectionExists.name, () => {
    describe('when the device is connected', () => {
      it('should return true', async () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConntectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockeddDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockeddDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConntectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockeddDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConntectionFactory), deviceService: instance(mockedDeviceService) })

        await testee.init()
        const isConnected: boolean = testee.connectionExists(iNewsDevice.id)

        expect(isConnected).toBeTruthy()
      })
    })

    describe('when the device is not connected', () => {
      it('should return false', () => {
        const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
        const devices: Device[] = [iNewsDevice]
        const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
        const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
        const mockedDeviceService: DeviceService = mock<DeviceService>()
        when(mockedDeviceConnection.connect()).thenResolve(true)
        when(mockedDeviceService.getDevices()).thenResolve(devices)
        when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
        const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

        const isConnected: boolean = testee.connectionExists(iNewsDevice.id)

        expect(isConnected).toBeFalsy()
      })
    })
  })

  describe(DeviceConnectionServiceImplementation.prototype.getConnectedDevices.name, () => {
    it('should retrieve a list of connected devices', async () => {
      const iNewsDevice: Device = EntityTestFactory.createDevice({ type: DeviceType.INEWS_GATEWAY, username: 'somerUserName', password: 'somePassword'})
      const devices: Device[] = [iNewsDevice]
      const mockedDeviceConnectionFactory: DeviceConnectionFactory = mock<DeviceConnectionFactory>()
      const mockedDeviceConnection: INewsGatewayDeviceConnection = mock<INewsGatewayDeviceConnection>()
      const mockedDeviceService: DeviceService = mock<DeviceService>()
      when(mockedDeviceConnection.connect()).thenResolve(true)
      when(mockedDeviceService.getDevices()).thenResolve(devices)
      when(mockedDeviceConnectionFactory.createDeviceConnection(iNewsDevice)).thenReturn(instance(mockedDeviceConnection))
      const testee: DeviceConnectionServiceImplementation = createTestee({deviceConnectionFactory: instance(mockedDeviceConnectionFactory), deviceService: instance(mockedDeviceService) })

      await testee.init()
      const connectedDevices: Device[] = testee.getConnectedDevices()

      expect(connectedDevices.length).toBeGreaterThan(0)
    })
  })
})

function createTestee(params?: {
  deviceConnectionFactory?: DeviceConnectionFactory,
  deviceService?: DeviceService
}): DeviceConnectionServiceImplementation {
  const factory: DeviceConnectionFactory = params?.deviceConnectionFactory ?? instance(mock<DeviceConnectionFactory>())
  const service: DeviceService = params?.deviceService ?? instance(mock<DeviceService>())
  const logger: Logger = new DummyLogger()

  return new DeviceConnectionServiceImplementation(
    factory,
    service,
    logger,
  )
}
