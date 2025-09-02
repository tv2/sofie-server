import { Part } from '../entities/part'

export interface PartRepository {
  getPart(partId: string): Promise<Part>
}
