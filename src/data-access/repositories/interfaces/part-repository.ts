import { Part } from '../../../model/entities/part'

export interface PartRepository {
  getPart(partId: string): Promise<Part>
  getParts(segmentId: string): Promise<Part[]>
  savePart(part: Part): Promise<void>
  delete(partId: string): Promise<void>
  deletePartsForSegment(segmentId: string): Promise<void>
  deleteUnsyncedPartsForSegment(segmentId: string): Promise<void>
  deleteAllUnsyncedParts(): Promise<void>
  deleteAllUnplannedParts(): Promise<void>
}
