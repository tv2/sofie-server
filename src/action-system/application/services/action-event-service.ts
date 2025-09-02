import { ActionEventEmitter } from '../interfaces/action-event-emitter'
import { ActionEventBuilder } from '../interfaces/action-event-builder'
import { ActionsUpdatedEvent } from '../value-objects/action-event'
import { Action } from '../../domain/entities/action'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class ActionEventService implements ActionEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly actionEventBuilder: ActionEventBuilder) {
  }

  public emitActionsUpdatedEvent(actions: Action[], rundownId?: string): void {
    const event: ActionsUpdatedEvent = this.actionEventBuilder.buildActionsUpdatedEvent(actions, rundownId)
    this.typedEventEmitter.emitTypedEvent(event)
  }
}
