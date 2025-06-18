import { HealthStatus } from '../enums/health-status'
import { HealthStatusEvent } from '../value-objects/health-status-event'

export interface HealthStatusEventBuilder {
  buildHealthStatusEvent(identifier: string, healthStatusCode: HealthStatus): HealthStatusEvent
}
