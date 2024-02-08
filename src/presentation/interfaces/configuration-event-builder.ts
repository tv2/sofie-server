import { Shelf } from '../../model/entities/shelf'
import { ShelfUpdatedEvent } from '../value-objects/configuration-event'

export interface ConfigurationEventBuilder {
  buildShelfUpdatedEvent(shelf: Shelf): ShelfUpdatedEvent
}
