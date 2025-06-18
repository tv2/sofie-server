import { GatewayConnector } from '../../application/interfaces/gatewayConnector'
import { Socket } from '../../../cross-cutting-concerns/infrastructure/interfaces/socket'

const HOST: string = process.env.INEWS_GATEWAY_HOST ?? 'ws://localhost:3008'
const FEATURE_FLAG: boolean = process.env.DISABLE_INEWS_GATEWAY === 'true'

const I_NEWS_GATEWAY_CONNECTOR_IDENTIFIER: string = 'iNewsGatewayConnector'

export class INewsGatewayConnector implements GatewayConnector {

  constructor(private readonly socket: Socket) {
  }

  public connect(): void {
    if (FEATURE_FLAG) {
      // TODO: This is temporary until we can release the new Ingest flow.
      return
    }
    this.socket.setHealthStatusIdentifier(I_NEWS_GATEWAY_CONNECTOR_IDENTIFIER)
    this.socket.connect<object[]>(
      this.getConnectionString(),
      (data) => this.onData(data)
    )
  }

  private getConnectionString(): string {
    const queues: string = ''
    return `${HOST}/?queues=${queues}`
  }

  private onData(_data: object[]): void {
    // TODO: Implement in later task - Update type as well.
    console.log(_data)
  }
}
