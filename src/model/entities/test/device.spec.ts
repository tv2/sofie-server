import { mock } from '@typestrong/ts-mockito'
import { INewsGatewayDevice, TelemetricsDevice } from '../device'

describe('INewsDevice and TelemetricsDevice', () => {
  it('should have correct properties and methods', () => {
    const newsDevice: INewsGatewayDevice = mock<INewsGatewayDevice>()
    const telemetryDevice: TelemetricsDevice = mock<TelemetricsDevice>()

    expect(newsDevice).toHaveProperty('id')
    expect(newsDevice).toHaveProperty('name')
    expect(newsDevice).toHaveProperty('isConnected')
    expect(newsDevice).toHaveProperty('statusCode')
    expect(newsDevice).toHaveProperty('statusMessage')
    expect(newsDevice).toHaveProperty('type')
    expect(newsDevice).toHaveProperty('username')
    expect(newsDevice).toHaveProperty('password')
    expect(telemetryDevice).toHaveProperty('id')
    expect(telemetryDevice).toHaveProperty('name')
    expect(telemetryDevice).toHaveProperty('isConnected')
    expect(telemetryDevice).toHaveProperty('statusCode')
    expect(telemetryDevice).toHaveProperty('statusMessage')
    expect(telemetryDevice).toHaveProperty('type')
    expect(telemetryDevice).toHaveProperty('host')
  })
})
