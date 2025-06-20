import { StatusMessageEventBuilder } from '../interfaces/status-message-event-builder'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageEvent } from '../value-objects/status-message-event'
import { StatusMessageEventType } from '../enums/status-message-event-type'
import { HealthStatusEventBuilder } from '../interfaces/health-status-event-builder'
import { HealthStatus } from '../enums/health-status'
import { HealthStatusEvent } from '../value-objects/health-status-event'
import { HealthStatusEventType } from '../enums/health-status-event-type'

export class CrossCuttingConcernsEventBuilder implements StatusMessageEventBuilder, HealthStatusEventBuilder {
  public buildStatusMessageEvent(statusMessage: StatusMessage): StatusMessageEvent {
    return {
      type: StatusMessageEventType.STATUS_MESSAGE,
      timestamp: Date.now(),
      statusMessage
    }
  }

  public buildHealthStatusEvent(identifier: string, healthStatusCode: HealthStatus): HealthStatusEvent {
    return {
      type: HealthStatusEventType.HEALTH_STATUS,
      timestamp: Date.now(),
      identifier,
      healthStatusCode
    }
  }
}
