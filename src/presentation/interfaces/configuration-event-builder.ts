import { ShelfConfiguration } from '../../model/entities/shelf-configuration'
import { ShelfConfigurationUpdatedEvent } from '../value-objects/configuration-event'

export interface ConfigurationEventBuilder {
  buildShelfConfigurationUpdatedEvent(shelfConfiguration: ShelfConfiguration): ShelfConfigurationUpdatedEvent
}
