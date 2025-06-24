import { TypedEvent } from '../value-objects/typed-event'

export interface TypedEventEmitter {
  emitTypedEvent(typedEvent: TypedEvent): void
}
