import { TypedEvent } from '../value-objects/typed-event'

export interface TypedEventObserver {
  subscribeToTypedEvents(onTypedEvent: (typedEvent: TypedEvent) => void): void
}
