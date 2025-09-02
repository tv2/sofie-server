import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'

export interface ConfigurationEventEmitter {
  emitShelfConfigurationUpdated(shelfConfiguration: ShelfConfiguration): void
}
