import { ShelfConfiguration } from '../entities/shelf-configuration'

// TODO: Move to Alba TV 2 server
export interface ShelfConfigurationRepository {
  getShelfConfiguration(): Promise<ShelfConfiguration>
  updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration>
}
