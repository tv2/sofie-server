import { Part } from '../../../model/entities/part'

export interface PartRepository {
  getPart(partId: string): Promise<Part>
  deletePart(partId: string): Promise<void>
  deleteUnsyncedPartsForSegment(segmentId: string): Promise<void>
  deleteAllUnsyncedParts(): Promise<void>
  deleteAllUnplannedParts(): Promise<void>
}
