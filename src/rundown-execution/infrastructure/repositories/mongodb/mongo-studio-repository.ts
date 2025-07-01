import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { StudioRepository } from '../../../domain/repositories/studio-repository'
import { Studio } from '../../../domain/entities/studio'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { RundownExecutionMongoEntityConverter, MongoStudio } from './rundown-execution-mongo-entity-converter'

const COLLECTION_NAME: string = 'studios'

export class MongoStudioRepository extends BaseMongoRepository<MongoStudio> implements StudioRepository {
  public constructor(mongoDatabase: MongoDatabase, private readonly rundownExecutionEntityConverter: RundownExecutionMongoEntityConverter) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getStudio(studioId: string): Promise<Studio> {
    this.assertDatabaseConnection(this.getStudio.name)
    const mongoStudio: MongoStudio | null = await this.getCollection().findOne<MongoStudio>({
      _id: studioId,
    })
    if (!mongoStudio) {
      throw new NotFoundException(`No Studio found for studioId: ${studioId}`)
    }
    return this.rundownExecutionEntityConverter.convertStudio(mongoStudio)
  }
}
