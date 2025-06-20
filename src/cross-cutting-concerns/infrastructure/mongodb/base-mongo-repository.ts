import { MongoDatabase } from './mongo-database'
import { AnyBulkWriteOperation, ClientSession, Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../exceptions/database-not-connected-exception'
import { MongoId } from '../../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'

export abstract class BaseMongoRepository<Model extends MongoId> {
  protected constructor(protected mongoDatabase: MongoDatabase) {}

  protected abstract getCollectionName(): string

  protected getCollection(): Collection<Model> {
    return this.mongoDatabase.getCollection(this.getCollectionName())
  }

  protected assertDatabaseConnection(queryName: string): void {
    if (!this.getCollection()) {
      throw new DatabaseNotConnectedException(
        `Unable to perform query: ${queryName} - not connected to database.collection: ${this.mongoDatabase.getDatabaseName()}.${this.getCollectionName()}`
      )
    }
  }

  public async executeQueries(queries: readonly AnyBulkWriteOperation<Model>[], session: ClientSession): Promise<void> {
    if (queries.length === 0) {
      return
    }
    await this.getCollection().bulkWrite([...queries], { session, ignoreUndefined: true })
  }
}
