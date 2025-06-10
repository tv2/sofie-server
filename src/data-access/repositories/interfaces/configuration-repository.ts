import { Configuration } from '../../../rundown-execution/domain/entities/configuration'

export interface ConfigurationRepository {
  clearConfigurationCache(): void
  getConfiguration(): Promise<Configuration>
}
