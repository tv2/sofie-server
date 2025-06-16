import { ConfigurationEvent } from '../value-objects/configuration-event'

// Rename to Shelf configuration
export interface ConfigurationEventObserver {
  subscribeToConfigurationEvents(onConfigurationEventCallback: (configurationEvent: ConfigurationEvent) => void): void
}
