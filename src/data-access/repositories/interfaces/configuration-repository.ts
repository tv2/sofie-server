import { Configuration } from '../../../model/entities/configuration'

export interface ConfigurationRepository {
  clearConfigurationCache(): Promise<void>
  getConfiguration(): Promise<Configuration>
}
