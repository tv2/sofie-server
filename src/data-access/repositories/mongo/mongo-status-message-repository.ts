import { BaseMongoRepository } from './base-mongo-repository'
import { StatusMessageRepository } from '../interfaces/status-message-repository'
import { StatusMessage } from '../../../model/entities/status-message'
import { MongoDatabase } from './mongo-database'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const STATUS_MESSAGE_COLLECTION_NAME: string = 'statusMessages'

export class MongoStatusMessageRepository extends BaseMongoRepository implements StatusMessageRepository {

  constructor(mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return STATUS_MESSAGE_COLLECTION_NAME
  }

  public async getStatusMessage(id: string): Promise<StatusMessage> {
    this.assertDatabaseConnection(this.getStatusMessage.name)
    const statusMessage: StatusMessage | null = await this.getCollection().findOne<StatusMessage>({ id })
    if (!statusMessage) {
      throw new NotFoundException(`No StatusMessage found for ${id}`)
    }
    return statusMessage
  }

  public async getAllStatusMessages(): Promise<StatusMessage[]> {
    this.assertDatabaseConnection(this.getAllStatusMessages.name)
    return this.getCollection().find<StatusMessage>({}).toArray()
  }

  public async getStatusMessagesWithIdPrefix(idPrefix: string): Promise<StatusMessage[]> {
    this.assertDatabaseConnection(this.getStatusMessagesWithIdPrefix.name)
    return this.getCollection().find<StatusMessage>({
      id: new RegExp(`^${idPrefix}`, 'g')
    }).toArray()
  }

  public async createStatusMessage(statusMessage: StatusMessage): Promise<StatusMessage> {
    this.assertDatabaseConnection(this.createStatusMessage.name)
    await this.getCollection().updateOne({ id: statusMessage.id }, { $set: statusMessage }, { upsert: true})
    return statusMessage
  }

  public async updateStatusMessage(statusMessage: StatusMessage): Promise<StatusMessage> {
    this.assertDatabaseConnection(this.updateStatusMessage.name)
    await this.getCollection().updateOne({ id: statusMessage.id }, { $set: statusMessage })
    return statusMessage
  }

  public async deleteStatusMessage(id: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteStatusMessage.name)
    await this.getCollection().deleteOne({ id })
  }
}
