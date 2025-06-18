import { HealthStatus } from '../enums/health-status'

export interface HealthStatusEventEmitter {
  emitHealthStatusEvent(identifier: string, healthStatusCode: HealthStatus): void
}
