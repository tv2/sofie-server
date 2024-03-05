import { ShelfConfiguration } from '../../../model/entities/shelf-configuration'

export interface ConfigurationEventEmitter {
  emitShelfConfigurationUpdated(shelfConfiguration: ShelfConfiguration): void
}
