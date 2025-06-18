import { HealthStatusEvent } from '../value-objects/health-status-event'

export interface HealthStatusEventObserver {
  subscribeToHealthStatusMessageEvents(onHealthStatusEventCallback: (healthStatusEvent: HealthStatusEvent) => void): void
}
