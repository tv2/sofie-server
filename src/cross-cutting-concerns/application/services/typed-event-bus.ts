import { TypedEventObserver } from '../interfaces/typed-event-observer'
import { TypedEventEmitter } from '../interfaces/typed-event-emitter'
import { TypedEvent } from '../value-objects/typed-event'

type TypedEventCallback = (typedEvent: TypedEvent) => void

export class TypedEventBus implements TypedEventObserver, TypedEventEmitter {
  private readonly callbacks: TypedEventCallback[] = []

  public subscribeToTypedEvents(onTypedEvent: (typedEvent: TypedEvent) => void): void {
    this.callbacks.push(onTypedEvent)
  }

  public emitTypedEvent(typedEvent: TypedEvent): void {
    this.callbacks.forEach(callback => callback(typedEvent))
  }
}
