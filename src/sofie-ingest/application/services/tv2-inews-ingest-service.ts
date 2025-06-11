import { IngestService } from '../interfaces/ingest-service'
import { HttpService } from '../../../cross-cutting-concerns/application/interfaces/http-service'
import { RundownRepository } from '../../../rundown-execution/domain/repositories/rundown-repository'
import { Rundown } from '../../../rundown-execution/domain/entities/rundown'
import { ServiceUnavailableException } from '../../../rundown-execution/domain/exceptions/service-unavailable-exception'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'
import { HttpError, HttpErrorCode } from '../../../cross-cutting-concerns/application/exceptions/http-error'

const INEWS_HOST: string = process.env.INEWS_HOST ?? 'localhost:3007'

export class Tv2INewsIngestService implements IngestService {

  constructor(private readonly httpService: HttpService, private readonly rundownRepository: RundownRepository) {}

  public async reloadIngestData(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const url: string = this.getReingestUrl(rundown.name)
    try {
      await this.httpService.post(url)
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.code === HttpErrorCode.CONNECTION_REFUSED) {
          throw new ServiceUnavailableException('Unable to reingest data from iNews. Check your iNews connection.')
        }
        if (/does not exist in playlist/i.test(error.message)) {
          throw new NotFoundException('Unable to reingest data, since the rundown is not configured for ingest.')
        }
      }
      throw error
    }
  }

  private getReingestUrl(rundownName: string): string {
    return `http://${INEWS_HOST}/rundowns/${rundownName}/reingest`
  }
}
