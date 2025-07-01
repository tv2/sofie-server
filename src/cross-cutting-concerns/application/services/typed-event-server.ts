import { TypedEvent } from '../value-objects/typed-event'
import { NtpEventType } from '../enums/ntp-event-type'
import { NtpEvent } from '../value-objects/ntp-event'
import { Logger } from '../interfaces/logger'
import { TypedEventObserver } from '../interfaces/typed-event-observer'
import { EventServer } from '../interfaces/event-server'

export class TypedEventServer {
  private readonly logger: Logger

  public constructor(
    private readonly eventServer: EventServer,
    private readonly typedEventObserver: TypedEventObserver,
    logger: Logger
  ) {
    this.logger = logger.tag(this.constructor.name)
  }

  public async startServer(port: number): Promise<void> {
    await this.eventServer.startServer(port)
    this.eventServer.setEventListener((eventText: string): string | undefined => {
      const event: TypedEvent | undefined = this.parseTypedEvent(eventText)

      if (!event) {
        this.logger.warn(`Expected typed event, but got: ${eventText}`)
        return
      }

      if (event.type === NtpEventType.NTP) {
        const ntpEvent: NtpEvent = { type: event.type, clientTimestamp: event.timestamp, timestamp: Date.now() }
        return JSON.stringify(ntpEvent)
      }
    })
    this.typedEventObserver.subscribeToTypedEvents((typedEvent: TypedEvent) => this.eventServer.emitEvent(JSON.stringify(typedEvent)))
  }

  private parseTypedEvent(eventText: string): TypedEvent | undefined {
    try {
      const event: unknown = JSON.parse(eventText)
      return this.isTypedEvent(event) ? event : undefined
    } catch {
      return
    }
  }

  private isTypedEvent(event: unknown): event is TypedEvent {
    if (typeof event !== 'object' || event === null) {
      return false
    }
    if (!('type' in event) || typeof event.type !== 'string') {
      return false
    }
    return 'timestamp' in event && typeof event.timestamp === 'number'
  }
}
