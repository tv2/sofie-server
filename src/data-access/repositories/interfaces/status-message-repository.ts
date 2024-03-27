import { StatusMessage } from '../../../model/entities/status-message'

export interface StatusMessageRepository {
  getStatusMessage(id: string): Promise<StatusMessage>
  getAllStatusMessages(): Promise<StatusMessage[]>
  getStatusMessagesWithIdPrefix(idPrefix: string): Promise<StatusMessage[]>
  createStatusMessage(statusMessage: StatusMessage): Promise<StatusMessage>
  updateStatusMessage(statusMessage: StatusMessage): Promise<StatusMessage>
  deleteStatusMessage(id: string): Promise<void>
}
