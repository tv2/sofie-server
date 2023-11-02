import { IngestService } from './interfaces/ingest-service'
import { HttpRequestParameters, HttpService } from './interfaces/http-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'

const DEFAULT_URL: string = 'localhost:3007'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService, private readonly rundownRepository: RundownRepository) {}

  public async reloadIngestData(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const url: string = this.getReingestUrl(rundown.name)
    const parameters: HttpRequestParameters = { url: url }
    await this.httpService.post(parameters)
  }

  private getReingestUrl(rundownName: string): string {
    const domain: string = process.env.INEWS_DOMAIN ?? DEFAULT_URL
    return `http://${domain}/rundowns/${rundownName}/reingest-data`
  }
}
