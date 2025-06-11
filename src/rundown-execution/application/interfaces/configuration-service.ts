import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'

export interface ConfigurationService {
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
