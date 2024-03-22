import { StatusMessage } from '../../model/entities/status-message'
import { StatusMessageService } from './interfaces/status-message-service'
import { StatusMessageEventEmitter } from './interfaces/status-message-event-emitter'
import { StatusMessageRepository } from '../../data-access/repositories/interfaces/status-message-repository'
import { StatusCode } from '../../model/enums/status-code'
import { NotFoundException } from '../../model/exceptions/not-found-exception'

export class StatusMessageServiceImplementation implements StatusMessageService {

  constructor(
    private readonly statusMessageEventEmitter: StatusMessageEventEmitter,
    private readonly statusMessageRepository: StatusMessageRepository
  ) { }

  public async updateStatusMessages(statusMessage: StatusMessage[]): Promise<void> {
    await Promise.all(
      statusMessage.map(statusMessage => this.updateStatusMessage(statusMessage))
    )
  }

  public async updateStatusMessage(statusMessage: StatusMessage): Promise<void> {
    const statusMessageFromDatabase: StatusMessage | undefined = await this.getStatusMessageFromDatabase(statusMessage.id)
    if (!statusMessageFromDatabase) {
      return this.createNewStatusMessageIfStatusIsNotGood(statusMessage)
    }

    if (!this.isStatusMessagesDifferent(statusMessage, statusMessageFromDatabase)) {
      return
    }

    this.statusMessageEventEmitter.emitStatusMessageEvent(statusMessage)

    if ([StatusCode.GOOD].includes(statusMessage.statusCode)) {
      await this.statusMessageRepository.deleteStatusMessage(statusMessage.id)
      return
    }

    await this.statusMessageRepository.updateStatusMessage(statusMessage)
  }

  private async createNewStatusMessageIfStatusIsNotGood(statusMessage: StatusMessage): Promise<void> {
    if ([StatusCode.GOOD].includes(statusMessage.statusCode)) {
      return
    }
    this.statusMessageEventEmitter.emitStatusMessageEvent(statusMessage)
    await this.statusMessageRepository.createStatusMessage(statusMessage)
  }

  private async getStatusMessageFromDatabase(statusMessageId: string): Promise<StatusMessage | undefined> {
    try {
      // We must await here. If we don't, then the try-catch does nothing resulting in wrong behaviour.
      return await this.statusMessageRepository.getStatusMessage(statusMessageId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return
      }
      throw error
    }
  }

  private isStatusMessagesDifferent(statusMessageOne: StatusMessage, statusMessageTwo: StatusMessage): boolean {
    const isDifferentStatusCode: boolean = statusMessageOne.statusCode != statusMessageTwo.statusCode
    const isDifferentMessage: boolean = statusMessageOne.message != statusMessageTwo.message
    return isDifferentStatusCode || isDifferentMessage
  }

  public async deleteStatusMessagesWithIdPrefixNotInCollection(idPrefix: string, statusMessagesToKeep: StatusMessage[]): Promise<void> {
    const statusMessageIdsNotToBeDeleted: string[] = statusMessagesToKeep.map(statusMessage => statusMessage.id)
    const statusMessages: StatusMessage[] = await this.statusMessageRepository.getStatusMessagesWithIdPrefix(idPrefix)

    await Promise.all(statusMessages.filter(statusMessage => !statusMessageIdsNotToBeDeleted.includes(statusMessage.id))
      .map(async statusMessage => {
        statusMessage.statusCode = StatusCode.GOOD
        statusMessage.message = ''
        this.statusMessageEventEmitter.emitStatusMessageEvent(statusMessage)
        await this.statusMessageRepository.deleteStatusMessage(statusMessage.id)
      }))
  }
}
