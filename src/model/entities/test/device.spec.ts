import { Device } from '../device'
import { INewsDevice } from '../inews-device'
import { TelemetricsDevice } from '../telemetrics-device'
import { mock } from '@typestrong/ts-mockito'

describe('INewsDevice and TelemetricsDevice', () => {
  it('should have correct properties and methods', () => {
    // Create instances of INewsDevice and TelemetricsDevice
    const newsDevice = mock<INewsDevice>()
    const telemetryDevice = mock<TelemetricsDevice>()

    // Check if they have the correct properties
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

    // Check if they have the connect() method
    expect(typeof newsDevice.connect).toBe('function')
    expect(typeof telemetryDevice.connect).toBe('function')
  })
})
