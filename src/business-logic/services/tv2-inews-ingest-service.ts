import { IngestService } from './interfaces/ingest-service'
import { HttpRequestParameters, HttpService } from './interfaces/http-service'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService) {}

  public async reloadIngestData(rundownName: string): Promise<void> {
    const domain = process.env.INEWS_DOMAIN ?? 'localhost:3007'
    const url = `http://${domain}/reloadData/${rundownName}`
    const parameters: HttpRequestParameters = { url: url }
    await this.httpService.post(parameters)
  }
}
