import { ConfigurationEvent } from '../value-objects/configuration-event'

export interface ConfigurationEventObserver {
  subscribeToConfigurationEvents(onConfigurationEventCallback: (configurationEvent: ConfigurationEvent) => void): void
}
