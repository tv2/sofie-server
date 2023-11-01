import { IngestService } from './interfaces/ingest-service'
import { HttpRequestParameters, HttpService } from './interfaces/http-service'

const DEFAULT_URL: string = 'localhost:3007'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService) {}

  public async reloadIngestData(rundownName: string): Promise<void> {
    const domain: string = process.env.INEWS_DOMAIN ?? DEFAULT_URL
    const url: string = `http://${domain}/reloadData/rundowns/${rundownName}`
    const parameters: HttpRequestParameters = { url: url }
    await this.httpService.post(parameters)
  }
}
