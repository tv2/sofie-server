import { BaseMongoRepository } from './base-mongo-repository'
import { StatusMessageRepository } from '../../domain/repositories/status-message-repository'
import { StatusMessage } from '../../domain/entities/status-message'
import { MongoDatabase } from './mongo-database'
import { NotFoundException } from '../../../rundown-execution/domain/exceptions/not-found-exception'
import { MongoId } from '../../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'

const STATUS_MESSAGE_COLLECTION_NAME: string = 'statusMessages'

export class MongoStatusMessageRepository extends BaseMongoRepository<StatusMessage & MongoId> implements StatusMessageRepository {
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
    statusMessage.lastUpdatedTimestamp = Date.now()
    await this.getCollection().updateOne({ id: statusMessage.id }, { $set: statusMessage }, { upsert: true })
    return statusMessage
  }

  public async updateStatusMessage(statusMessage: StatusMessage): Promise<StatusMessage> {
    this.assertDatabaseConnection(this.updateStatusMessage.name)
    statusMessage.lastUpdatedTimestamp = Date.now()
    await this.getCollection().updateOne({ id: statusMessage.id }, { $set: statusMessage })
    return statusMessage
  }

  public async deleteStatusMessage(id: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteStatusMessage.name)
    await this.getCollection().deleteOne({ id })
  }
}
