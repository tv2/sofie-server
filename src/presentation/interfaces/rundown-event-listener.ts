import { RundownEvent } from '../value-objects/rundown-event'

export interface RundownEventListener {
  listenToRundownEvents(onRundownEventCallback: (rundownEvent: RundownEvent) => void): void
}
