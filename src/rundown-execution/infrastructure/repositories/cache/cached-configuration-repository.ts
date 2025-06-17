import { ConfigurationRepository } from '../../../domain/repositories/configuration-repository'
import { Configuration } from '../../../domain/entities/configuration'

export class CachedConfigurationRepository implements ConfigurationRepository {
  private cachedConfiguration: Configuration | undefined

  public constructor(private readonly configurationRepository: ConfigurationRepository) {}

  public async getConfiguration(): Promise<Configuration> {
    this.cachedConfiguration ??= await this.configurationRepository.getConfiguration()
    return this.cachedConfiguration
  }

  public clearConfigurationCache(): void {
    this.cachedConfiguration = undefined
  }
}
