import { Part } from '../../../model/entities/part'

export interface PartRepository {
  getPart(partId: string): Promise<Part>
}
