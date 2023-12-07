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
    if (!this.cachedSegments.has(segmentId)) {
      const segment: Segment = await this.segmentRepository.getSegment(segmentId)
      this.cachedSegments.set(segmentId, segment)
    }
    return this.cachedSegments.get(segmentId) as Segment
  }

  public async getSegments(rundownId: string): Promise<Segment[]> {
    const segments: Segment[] = await this.segmentRepository.getSegments(rundownId)
    segments.forEach(segment => this.cachedSegments.set(segment.id, segment))
    return segments
  }

  public async saveSegment(segment: Segment): Promise<void> {
    this.cachedSegments.set(segment.id, segment)
    return this.segmentRepository.saveSegment(segment)
  }

  public async delete(segmentId: string): Promise<void> {
    this.cachedSegments.delete(segmentId)
    return this.segmentRepository.delete(segmentId)
  }

  public async deleteSegmentsForRundown(rundownId: string): Promise<void> {
    this.deleteCachedSegmentsWithPredicate(segment => segment.rundownId === rundownId)
    return this.segmentRepository.deleteSegmentsForRundown(rundownId)
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
    this.deleteCachedSegmentsWithPredicate(segment => segment.isUnsynced())
    return this.segmentRepository.deleteAllUnsyncedSegments()
  }

  public async deleteUnsyncedSegmentsForRundown(rundownId: string): Promise<void> {
    this.deleteCachedSegmentsWithPredicate(segment => segment.isUnsynced() && segment.rundownId === rundownId)
    return this.segmentRepository.deleteSegmentsForRundown(rundownId)
  }
}
