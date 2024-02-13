import { ShelfConfiguration } from '../../../model/entities/shelf-configuration'

export interface ShelfConfigurationRepository {
  getShelfConfiguration(): Promise<ShelfConfiguration>
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
