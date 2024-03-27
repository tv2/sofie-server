import { Configuration } from '../../../model/entities/configuration'

export interface ConfigurationRepository {
  clearConfigurationCache(): void
  getConfiguration(): Promise<Configuration>
}
