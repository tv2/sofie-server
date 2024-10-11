import { PartRepository } from '../interfaces/part-repository'
import { Part } from '../../../model/entities/part'

export class CachedPartRepository implements PartRepository {
  private static instance: PartRepository

  public static getInstance(partRepository: PartRepository): PartRepository {
    if (!this.instance) {
      this.instance = new CachedPartRepository(partRepository)
    }
    return this.instance
  }

  private readonly cachedParts: Map<string, Part> = new Map()

  private constructor(private readonly partRepository: PartRepository) {}

  public async getPart(partId: string): Promise<Part> {
    const part: Part = this.cachedParts.get(partId) ?? await this.partRepository.getPart(partId)
    this.cachedParts.set(partId, part)
    return part
  }

  public async getParts(segmentId: string): Promise<Part[]> {
    const parts: Part[] = await this.partRepository.getParts(segmentId)
    parts.forEach(part => this.cachedParts.set(part.id, part))
    return parts
  }

  public async savePart(part: Part): Promise<void> {
    await this.partRepository.savePart(part)
    this.cachedParts.set(part.id, part)
  }

  public async delete(partId: string): Promise<void> {
    await this.partRepository.delete(partId)
    this.cachedParts.delete(partId)
  }

  public async deletePartsForSegment(segmentId: string): Promise<void> {
    await this.partRepository.deletePartsForSegment(segmentId)
    this.deleteCachedPartsWithPredicate(part => part.getSegmentId() === segmentId)
  }

  private deleteCachedPartsWithPredicate(predicate: (part: Part) => boolean): void {
    this.cachedParts.forEach(part => {
      if (!predicate(part)) {
        return
      }
      this.cachedParts.delete(part.id)
    })
  }

  public async deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    await this.partRepository.deleteUnsyncedPartsForSegment(segmentId)
    this.deleteCachedPartsWithPredicate(part => part.isUnsynced() && part.getSegmentId() === segmentId)
  }

  public async deleteAllUnplannedParts(): Promise<void> {
    await this.partRepository.deleteAllUnplannedParts()
    this.deleteCachedPartsWithPredicate(part => !part.isPlanned)
  }

  public async deleteAllUnsyncedParts(): Promise<void> {
    await this.partRepository.deleteAllUnsyncedParts()
    this.deleteCachedPartsWithPredicate(part => part.isUnsynced())
  }
}
