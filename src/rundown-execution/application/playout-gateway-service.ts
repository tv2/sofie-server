import { PlayoutService } from './playout-service'
import { HttpService } from '../../cross-cutting-concerns/application/http-service'
import { Logger } from '../../cross-cutting-concerns/application/logger'

const PLAYOUT_GATEWAY_HOST: string = process.env.PLAYOUT_GATEWAY_HOST ?? 'localhost:3009'

export class PlayoutGatewayService implements PlayoutService {

  private readonly logger: Logger

  constructor(private readonly httpService: HttpService, logger: Logger) {
    this.logger = logger.tag(PlayoutGatewayService.name)
  }

  public async makeDevicesReady(okToDestroyStuff: boolean, activeRundownId: string): Promise<void> {
    const okToDestroyStuffParameterName: string = 'okToDestroyStuff'
    const activeRundownIdParameterName: string = 'activeRundownId'
    try {
      await this.httpService.post(`http://${PLAYOUT_GATEWAY_HOST}/devicesMakeReady?${okToDestroyStuffParameterName}=${okToDestroyStuff}&${activeRundownIdParameterName}=${activeRundownId}`)
    } catch (error) {
      this.logger.data(error).error('Error happened while calling \'makeDevicesReady\' in PlayoutGateway')
    }
  }

  public async makeDevicesStandDown(): Promise<void> {
    try {
      await this.httpService.post(`http://${PLAYOUT_GATEWAY_HOST}/devicesStandDown`)
    } catch (error) {
      this.logger.data(error).error('Error happened while calling \'makeDevicesStandDown\' in PlayoutGateway')
    }
  }
}
