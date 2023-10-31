import { IngestService } from './interfaces/ingest-service'

export class Tv2InewsIngestService implements IngestService {
  constructor() {}
  public async reloadIngestData(rundownName: string): Promise<void> {
    await Promise.resolve(console.log('something'))
    console.log(rundownName)
  }
}
