export interface IngestService {
  segmentCreated(segmentId: string): void
  segmentDeleted(segmentId: string): void
}
