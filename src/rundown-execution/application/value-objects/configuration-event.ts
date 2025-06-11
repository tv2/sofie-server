import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'
import {ConfigurationEventType} from '../enums/configuration-event-type'

export type ConfigurationEvent = ShelfConfigurationUpdatedEvent

export interface ShelfConfigurationUpdatedEvent extends TypedEvent {
  type: ConfigurationEventType.SHELF_CONFIGURATION_UPDATED
  shelfConfiguration: ShelfConfiguration
}
