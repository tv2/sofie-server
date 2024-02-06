import { Shelf } from '../../../model/entities/shelf'

export interface ConfigurationEventEmitter {
  emitShelfUpdated(shelf: Shelf): void
}
