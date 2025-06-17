import { StatusMessage } from '../../domain/entities/status-message'
import { StatusCode } from '../../domain/enums/status-code'

export class StatusMessageDto {
  public readonly id: string
  public readonly title: string
  public readonly message: string
  public readonly statusCode: StatusCode
  public readonly lastUpdatedTimestamp?: number

  public constructor(statusMessage: StatusMessage) {
    this.id = statusMessage.id
    this.title = statusMessage.title
    this.message = statusMessage.message
    this.statusCode = statusMessage.statusCode
    this.lastUpdatedTimestamp = statusMessage.lastUpdatedTimestamp
  }
}
