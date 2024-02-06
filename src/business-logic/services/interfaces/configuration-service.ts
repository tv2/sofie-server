import { Shelf } from '../../../model/entities/shelf'

export interface ConfigurationService {
  updateShelf(shelf: Shelf): Promise<Shelf>
}
