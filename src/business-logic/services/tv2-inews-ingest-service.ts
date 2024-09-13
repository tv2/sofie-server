import { IngestService } from './interfaces/ingest-service'
import { HttpErrorResponse, HttpErrorResponseCode, HttpService } from './interfaces/http-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { ServiceUnavailableException } from '../../model/exceptions/service-unavailable-exception'

const INEWS_HOST: string = process.env.INEWS_HOST ?? 'localhost:3007'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService, private readonly rundownRepository: RundownRepository) {}

  public async reloadIngestData(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const url: string = this.getReingestUrl(rundown.name)
    try {
      await this.httpService.post(url, null)
    } catch (error) {
      const errorResponse: HttpErrorResponse = error as HttpErrorResponse
      if (errorResponse.code === HttpErrorResponseCode.CONNECTION_REFUSED) {
        throw new ServiceUnavailableException('Unable to reingest data from iNews. Check your iNews connection...')
      }
      throw error
    }
  }

  private getReingestUrl(rundownName: string): string {
    return `http://${INEWS_HOST}/rundowns/${rundownName}/reingest`
  }
}
