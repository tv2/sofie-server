import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoId } from './mongo-entity-converter'
import { AnyBulkWriteOperation } from 'mongodb'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'

const EXPECTED_PLAYOUT_ITEMS_COLLECTION_NAME: string = 'expectedPlayoutItems'

interface ExpectedPlayoutItem extends MongoId {
  rundownId: string
}

export class MongoExpectedPlayoutItemRepository extends BaseMongoRepository<ExpectedPlayoutItem> {
  constructor(protected mongoDatabase: MongoDatabase) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return EXPECTED_PLAYOUT_ITEMS_COLLECTION_NAME
  }

  public buildDeleteExpectedPlayoutItemsForRundownQuery(rundownId: string): AnyBulkWriteOperation<ExpectedPlayoutItem> {
    return {
      deleteMany: {
        filter: { rundownId },
      },
    }
  }
}
