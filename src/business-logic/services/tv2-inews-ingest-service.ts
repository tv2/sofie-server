import { IngestService } from './interfaces/ingest-service'
import { HttpService } from './interfaces/http-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'

const INEWS_HOST: string = process.env.INEWS_HOST ?? 'localhost:3007'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService, private readonly rundownRepository: RundownRepository) {}

  public async reloadIngestData(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const url: string = this.getReingestUrl(rundown.name)
    await this.httpService.post(url, null)
  }

  private getReingestUrl(rundownName: string): string {
    return `http://${INEWS_HOST}/rundowns/${rundownName}/reingest`
  }
}
