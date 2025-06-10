import { ShelfConfiguration } from '../../../rundown-execution/domain/entities/shelf-configuration'

export interface ShelfConfigurationRepository {
  getShelfConfiguration(): Promise<ShelfConfiguration>
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
