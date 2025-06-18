import { TypedEvent } from './typed-event'
import { HealthStatusEventType } from '../enums/health-status-event-type'
import { HealthStatus } from '../enums/health-status'

export interface HealthStatusEvent extends TypedEvent {
  type: HealthStatusEventType.HEALTH_STATUS
  identifier: string // This should be used to identify the device, gateway, whatever that might have a health status.
  healthStatusCode: HealthStatus
}
