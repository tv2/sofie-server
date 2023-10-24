import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoId } from './mongo-entity-converter'
import { Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../../../model/exceptions/database-not-connected-exception'

export abstract class BaseMongoRepository<T extends MongoId = MongoId> {
  protected constructor(
    protected mongoDatabase: MongoDatabase<T>,
    protected mongoEntityConverter: MongoEntityConverter
  ) {}

  protected abstract getCollectionName(): string

  protected getCollection(): Collection<T> {
    return this.mongoDatabase.getCollection(this.getCollectionName())
  }

  protected assertDatabaseConnection(queryName: string): void {
    if (!this.getCollection()) {
      throw new DatabaseNotConnectedException(
        `Unable to perform query: ${queryName} - not connected to database.collection: ${this.mongoDatabase.getDatabaseName()}.${this.getCollectionName()}`
      )
    }
  }
}
