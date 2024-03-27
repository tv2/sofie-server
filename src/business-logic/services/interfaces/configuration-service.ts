import { ShelfConfiguration } from '../../../model/entities/shelf-configuration'

export interface ConfigurationService {
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
