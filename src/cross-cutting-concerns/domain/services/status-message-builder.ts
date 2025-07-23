import { StatusMessage } from '../entities/status-message'
import { StatusCode } from '../enums/status-code'

export class StatusMessageBuilder {
  private readonly statusMessage: Readonly<StatusMessage>

  public static fromId(id: string): StatusMessageBuilder {
    return new StatusMessageBuilder({
      id,
      statusCode: StatusCode.UNKNOWN,
      message: '',
      title: '',
    })
  }

  private constructor(statusMessage: StatusMessage) {
    this.statusMessage = statusMessage
  }

  public withStatusCode(statusCode: StatusCode): StatusMessageBuilder {
    return new StatusMessageBuilder({ ...this.statusMessage, statusCode })
  }

  public withTitle(title: string): StatusMessageBuilder {
    return new StatusMessageBuilder({ ...this.statusMessage, title })
  }

  public withMessage(message: string): StatusMessageBuilder {
    return new StatusMessageBuilder({ ...this.statusMessage, message })
  }

  public withLastUpdatedTimestamp(lastUpdatedTimestamp: number): StatusMessageBuilder {
    return new StatusMessageBuilder({ ...this.statusMessage, lastUpdatedTimestamp })
  }

  public build(): StatusMessage {
    return { ...this.statusMessage }
  }
}
