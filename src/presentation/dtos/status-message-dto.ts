import { StatusMessage } from '../../model/entities/status-message'
import { StatusCode } from '../../model/enums/status-code'

export class StatusMessageDto {

  public readonly id: string
  public readonly title: string
  public readonly message: string
  public readonly statusCode: StatusCode

  constructor(statusMessage: StatusMessage) {
    this.id = statusMessage.id
    this.title = statusMessage.title
    this.message = statusMessage.message
    this.statusCode = statusMessage.statusCode
  }
}
