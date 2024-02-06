import { TypedEvent } from './typed-event'
import { ConfigurationEventType } from '../enums/event-type'
import { Shelf } from '../../model/entities/shelf'

export type ConfigurationEvent = ShelfUpdatedEvent

export interface ShelfUpdatedEvent extends TypedEvent {
  type: ConfigurationEventType.SHELF_UPDATED
  shelf: Shelf
}
