import { BaseMongoRepository } from './base-mongo-repository'
import { ShowStyleRepository } from '../interfaces/show-style-repository'
import { ShowStyle } from '../../../model/entities/show-style'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoShowStyle } from './mongo-entity-converter'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const COLLECTION_NAME: string = 'showStyleBases'

export class MongoShowStyleRepository extends BaseMongoRepository implements ShowStyleRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getShowStyle(showStyleId: string): Promise<ShowStyle> {
    this.assertDatabaseConnection(this.getShowStyle.name)
    const mongoShowStyle: MongoShowStyle | null = (await this.getCollection().findOne<MongoShowStyle>({
      _id: showStyleId,
    }))
    if (!mongoShowStyle) {
      throw new NotFoundException(`No ShowStyle found for showStyleId: ${showStyleId}`)
    }
    return this.mongoEntityConverter.convertShowStyle(mongoShowStyle)
  }
}
