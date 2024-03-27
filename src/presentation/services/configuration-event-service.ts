import { ConfigurationEventEmitter } from '../../business-logic/services/interfaces/configuration-event-emitter'
import { ShelfConfiguration } from '../../model/entities/shelf-configuration'
import { ConfigurationEventObserver } from '../interfaces/configuration-event-observer'
import { ConfigurationEvent, ShelfConfigurationUpdatedEvent } from '../value-objects/configuration-event'
import { ConfigurationEventBuilder } from '../interfaces/configuration-event-builder'

export class ConfigurationEventService implements ConfigurationEventEmitter, ConfigurationEventObserver {

  private static instance: ConfigurationEventService

  public static getInstance(configurationEventBuilder: ConfigurationEventBuilder): ConfigurationEventService {
    if (!this.instance) {
      this.instance = new ConfigurationEventService(configurationEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((configurationEvent: ConfigurationEvent) => void)[] = []

  constructor(private readonly configurationEventBuilder: ConfigurationEventBuilder) { }

  public emitShelfConfigurationUpdated(shelfConfiguration: ShelfConfiguration): void {
    const shelfConfigurationUpdatedEvent: ShelfConfigurationUpdatedEvent = this.configurationEventBuilder.buildShelfConfigurationUpdatedEvent(shelfConfiguration)
    this.emitConfigurationEvents(shelfConfigurationUpdatedEvent)
  }

  private emitConfigurationEvents(configurationEvent: ConfigurationEvent): void {
    this.callbacks.forEach(callback => callback(configurationEvent))
  }

  public subscribeToConfigurationEvents(onConfigurationEventCallback: (configurationEvent: ShelfConfigurationUpdatedEvent) => void): void {
    this.callbacks.push(onConfigurationEventCallback)
  }
}
