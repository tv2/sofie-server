import { ShelfConfiguration } from '../../rundown-execution/domain/entities/shelf-configuration'
import { ShelfConfigurationUpdatedEvent } from '../value-objects/configuration-event'

export interface ConfigurationEventBuilder {
  buildShelfConfigurationUpdatedEvent(shelfConfiguration: ShelfConfiguration): ShelfConfigurationUpdatedEvent
}
