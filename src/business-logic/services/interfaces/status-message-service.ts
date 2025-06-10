import { StatusMessage } from '../../../rundown-execution/domain/entities/status-message'

export interface StatusMessageService {
  updateStatusMessage(statusMessage: StatusMessage): Promise<void>
  updateStatusMessages(statusMessage: StatusMessage[]): Promise<void>
  deleteStatusMessagesWithIdPrefixNotInCollection(idPrefix: string, statusMessagesToKeep: StatusMessage[]): Promise<void>
}
