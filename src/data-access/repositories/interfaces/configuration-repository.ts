import { Configuration } from '../../../model/entities/configuration'

export interface ConfigurationRepository {
  getConfiguration(): Promise<Configuration>
}

