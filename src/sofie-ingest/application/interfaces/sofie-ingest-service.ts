export interface SofieIngestService {
  reloadIngestData(rundownName: string): Promise<void>
}
