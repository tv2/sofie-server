import { Shelf } from '../../../model/entities/shelf'

export interface ShelfRepository {
  getShelf(): Promise<Shelf>
  updateShelf(shelf: Shelf): Promise<Shelf>
}
