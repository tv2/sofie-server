export interface IngestService {
  reloadIngestData(rundownName: string): Promise<void>
}
