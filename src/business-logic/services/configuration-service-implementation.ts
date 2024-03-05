import { ShelfConfiguration } from '../../model/entities/shelf-configuration'
import { ConfigurationService } from './interfaces/configuration-service'
import { ConfigurationEventEmitter } from './interfaces/configuration-event-emitter'
import { ShelfConfigurationRepository } from '../../data-access/repositories/interfaces/shelf-configuration-repository'

export class ConfigurationServiceImplementation implements ConfigurationService {

  constructor(
    private readonly configurationEventEmitter: ConfigurationEventEmitter,
    private readonly shelfConfigurationRepository: ShelfConfigurationRepository
  ) { }

  public async updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration> {
    const updatedShelfConfiguration: ShelfConfiguration = await this.shelfConfigurationRepository.updateShelfConfiguration(shelfConfiguration)
    this.configurationEventEmitter.emitShelfConfigurationUpdated(updatedShelfConfiguration)
    return updatedShelfConfiguration
  }
}
