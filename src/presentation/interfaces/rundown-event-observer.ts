import { RundownEvent } from '../value-objects/rundown-event'

export interface RundownEventObserver {
  subscribeToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void): void
}
