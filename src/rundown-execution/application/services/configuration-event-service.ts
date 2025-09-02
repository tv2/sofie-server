import { ConfigurationEventEmitter } from '../interfaces/configuration-event-emitter'
import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'
import { ConfigurationEvent, ShelfConfigurationUpdatedEvent } from '../value-objects/configuration-event'
import { ConfigurationEventBuilder } from '../interfaces/configuration-event-builder'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class ConfigurationEventService implements ConfigurationEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly configurationEventBuilder: ConfigurationEventBuilder) { }

  public emitShelfConfigurationUpdated(shelfConfiguration: ShelfConfiguration): void {
    const shelfConfigurationUpdatedEvent: ShelfConfigurationUpdatedEvent = this.configurationEventBuilder.buildShelfConfigurationUpdatedEvent(shelfConfiguration)
    this.emitConfigurationEvents(shelfConfigurationUpdatedEvent)
  }

  private emitConfigurationEvents(configurationEvent: ConfigurationEvent): void {
    this.typedEventEmitter.emitTypedEvent(configurationEvent)
  }
}
