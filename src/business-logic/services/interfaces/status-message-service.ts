import { StatusMessage } from '../../../model/entities/status-message'

export interface StatusMessageService {
  updateStatusMessage(statusMessage: StatusMessage): Promise<void>
  updateStatusMessages(statusMessage: StatusMessage[]): Promise<void>
  deleteStatusMessagesWithIdPrefixNotInCollection(idPrefix: string, statusMessagesToKeep: StatusMessage[]): Promise<void>
}
