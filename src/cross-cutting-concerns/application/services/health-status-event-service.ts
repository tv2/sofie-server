import { HealthStatusEventEmitter } from '../interfaces/health-status-event-emitter'
import { HealthStatusEventObserver } from '../interfaces/health-status-event-observer'
import { HealthStatusEventBuilder } from '../interfaces/health-status-event-builder'
import { HealthStatus } from '../enums/health-status'
import { HealthStatusEvent } from '../value-objects/health-status-event'

export class HealthStatusEventService implements HealthStatusEventEmitter, HealthStatusEventObserver {

  private readonly callbacks: ((healthStatusEvent: HealthStatusEvent) => void)[] = []

  constructor(private readonly healthStatusMessageBuilder: HealthStatusEventBuilder) { }

  public emitHealthStatusEvent(identifier: string, healthStatusCode: HealthStatus): void {
    const healthStatusEvent: HealthStatusEvent = this.healthStatusMessageBuilder.buildHealthStatusEvent(identifier, healthStatusCode)
    this.callbacks.forEach(callback => callback(healthStatusEvent))
  }

  public subscribeToHealthStatusMessageEvents(onHealthStatusEventCallback: (healthStatusEvent: HealthStatusEvent) => void): void {
    this.callbacks.push(onHealthStatusEventCallback)
  }
}
