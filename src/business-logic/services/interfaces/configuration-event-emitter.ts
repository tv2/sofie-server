import { ShelfConfiguration } from '../../../rundown-execution/domain/entities/shelf-configuration'

export interface ConfigurationEventEmitter {
  emitShelfConfigurationUpdated(shelfConfiguration: ShelfConfiguration): void
}
