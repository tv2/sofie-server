import { TypedEvent } from './typed-event'
import { ConfigurationEventType } from '../enums/event-type'
import { ShelfConfiguration } from '../../model/entities/shelf-configuration'

export type ConfigurationEvent = ShelfConfigurationUpdatedEvent

export interface ShelfConfigurationUpdatedEvent extends TypedEvent {
  type: ConfigurationEventType.SHELF_CONFIGURATION_UPDATED
  shelfConfiguration: ShelfConfiguration
}
