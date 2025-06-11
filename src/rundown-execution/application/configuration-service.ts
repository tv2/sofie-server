import { ShelfConfiguration } from '../../../rundown-execution/domain/entities/shelf-configuration'

export interface ConfigurationService {
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
