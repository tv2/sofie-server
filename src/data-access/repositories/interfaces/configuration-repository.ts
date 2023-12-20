import { Configuration } from '../../../model/entities/configuration'

export interface ConfigurationRepository {
  clearConfigurationCache(): unknown
  getConfiguration(): Promise<Configuration>
}
