import { SegmentRepository } from '../interfaces/segment-repository'
import { Segment } from '../../../model/entities/segment'

export class CachedSegmentRepository implements SegmentRepository {
  private static instance: SegmentRepository

  public static getInstance(segmentRepository: SegmentRepository): SegmentRepository {
    if (!this.instance) {
      this.instance = new CachedSegmentRepository(segmentRepository)
    }
    return this.instance
  }

  private readonly cachedSegments: Map<string, Segment> = new Map()

  private constructor(private readonly segmentRepository: SegmentRepository) {}

  public async getSegment(segmentId: string): Promise<Segment> {
    const segment: Segment = this.cachedSegments.get(segmentId) ?? await this.segmentRepository.getSegment(segmentId)
    this.cachedSegments.set(segmentId, segment)
    return segment
  }

  public async getSegments(rundownId: string): Promise<Segment[]> {
    const segments: Segment[] = await this.segmentRepository.getSegments(rundownId)
    segments.forEach(segment => this.cachedSegments.set(segment.id, segment))
    return segments
  }

  public async saveSegment(segment: Segment): Promise<void> {
    await this.segmentRepository.saveSegment(segment)
    this.cachedSegments.set(segment.id, segment)
  }

  public async delete(segmentId: string): Promise<void> {
    await this.segmentRepository.delete(segmentId)
    this.cachedSegments.delete(segmentId)
  }

  public async deleteSegmentsForRundown(rundownId: string): Promise<void> {
    await this.segmentRepository.deleteSegmentsForRundown(rundownId)
    this.deleteCachedSegmentsWithPredicate(segment => segment.rundownId === rundownId)
  }

  private deleteCachedSegmentsWithPredicate(predicate: (segment: Segment) => boolean): void {
    this.cachedSegments.forEach(segment => {
      if (!predicate(segment)) {
        return
      }
      this.cachedSegments.delete(segment.id)
    })
  }

  public async deleteAllUnsyncedSegments(): Promise<void> {
    await this.segmentRepository.deleteAllUnsyncedSegments()
    this.deleteCachedSegmentsWithPredicate(segment => segment.isUnsynced())
  }

  public async deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    await this.segmentRepository.deleteSegmentsForRundown(rundownId)
    this.deleteCachedSegmentsWithPredicate(segment => segment.isUnsynced() && segment.rundownId === rundownId)
  }
}
