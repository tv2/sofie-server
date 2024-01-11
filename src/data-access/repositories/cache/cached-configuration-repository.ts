import { ConfigurationRepository } from '../interfaces/configuration-repository'
import { Configuration } from '../../../model/entities/configuration'

export class CachedConfigurationRepository implements ConfigurationRepository {
  private static instance: ConfigurationRepository

  public static getInstance(configurationRepository: ConfigurationRepository): ConfigurationRepository {
    if (!this.instance) {
      this.instance = new CachedConfigurationRepository(configurationRepository)
    }
    return this.instance
  }

  private cachedConfiguration: Configuration | undefined

  private constructor(private readonly configurationRepository: ConfigurationRepository) {}

  public async getConfiguration(): Promise<Configuration> {
    if (!this.cachedConfiguration) {
      this.cachedConfiguration = await this.configurationRepository.getConfiguration()
    }
    return this.cachedConfiguration
  }

  public clearConfigurationCache(): void {
    this.cachedConfiguration = undefined
  }
}
