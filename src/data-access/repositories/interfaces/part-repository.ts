import { Part } from '../../../rundown-execution/domain/entities/part'

export interface PartRepository {
  getPart(partId: string): Promise<Part>
}
