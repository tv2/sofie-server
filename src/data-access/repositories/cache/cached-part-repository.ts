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
    if (!this.cachedParts.has(partId)) {
      const part: Part = await this.partRepository.getPart(partId)
      this.cachedParts.set(partId, part)
    }
    return this.cachedParts.get(partId) as Part
  }

  public async getParts(segmentId: string): Promise<Part[]> {
    const parts: Part[] = await this.partRepository.getParts(segmentId)
    parts.forEach(part => this.cachedParts.set(part.id, part))
    return parts
  }

  public async savePart(part: Part): Promise<void> {
    this.cachedParts.set(part.id, part)
    return this.partRepository.savePart(part)
  }

  public async delete(partId: string): Promise<void> {
    this.cachedParts.delete(partId)
    return this.partRepository.delete(partId)
  }

  public async deletePartsForSegment(segmentId: string): Promise<void> {
    this.deletePartsWithPredicate(part => part.getSegmentId() === segmentId)
    return this.partRepository.deletePartsForSegment(segmentId)
  }

  private deletePartsWithPredicate(predicate: (part: Part) => boolean): void {
    const segmentIdsToDelete: string[] = []
    this.cachedParts.forEach((part, partId) => {
      if (predicate(part)) {
        segmentIdsToDelete.push(partId)
      }
    })
    segmentIdsToDelete.forEach(id => this.cachedParts.delete(id))
  }

  public async deleteUnsyncedPartsForSegment(segmentId: string): Promise<void> {
    this.deletePartsWithPredicate(part => part.isUnsynced() && part.getSegmentId() === segmentId)
    return this.partRepository.deleteUnsyncedPartsForSegment(segmentId)
  }

  public async deleteAllUnplannedParts(): Promise<void> {
    this.deletePartsWithPredicate(part => !part.isPlanned)
    return this.partRepository.deleteAllUnplannedParts()
  }

  public async deleteAllUnsyncedParts(): Promise<void> {
    this.deletePartsWithPredicate(part => part.isUnsynced())
    return this.partRepository.deleteAllUnsyncedParts()
  }
}
