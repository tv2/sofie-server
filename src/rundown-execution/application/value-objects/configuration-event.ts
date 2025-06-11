import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { ConfigurationEventType } from '../../../leftovers/event-type'
import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'

export type ConfigurationEvent = ShelfConfigurationUpdatedEvent

export interface ShelfConfigurationUpdatedEvent extends TypedEvent {
  type: ConfigurationEventType.SHELF_CONFIGURATION_UPDATED
  shelfConfiguration: ShelfConfiguration
}
