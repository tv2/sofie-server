import { ConfigurationEventEmitter } from '../../business-logic/services/interfaces/configuration-event-emitter'
import { Shelf } from '../../model/entities/shelf'
import { ConfigurationEventObserver } from '../interfaces/configuration-event-observer'
import { ConfigurationEvent, ShelfUpdatedEvent } from '../value-objects/configuration-event'
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

  public emitShelfUpdated(shelf: Shelf): void {
    const shelfUpdatedEvent: ShelfUpdatedEvent = this.configurationEventBuilder.buildShelfUpdatedEvent(shelf)
    this.emitConfigurationEvents(shelfUpdatedEvent)
  }

  private emitConfigurationEvents(configurationEvent: ConfigurationEvent): void {
    this.callbacks.forEach(callback => callback(configurationEvent))
  }

  public subscribeToConfigurationEvents(onConfigurationEventCallback: (configurationEvent: ShelfUpdatedEvent) => void): void {
    this.callbacks.push(onConfigurationEventCallback)
  }
}
