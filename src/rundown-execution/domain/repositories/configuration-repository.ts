import { Configuration } from '../entities/configuration'

export interface ConfigurationRepository {
  clearConfigurationCache(): void
  getConfiguration(): Promise<Configuration>
}
