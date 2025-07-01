import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { ShowStyleRepository } from '../../../domain/repositories/show-style-repository'
import { ShowStyle } from '../../../domain/entities/show-style'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../../cross-cutting-concerns/domain/exceptions/not-found-exception'
import { ShowStyleVariantRepository } from '../../../domain/repositories/show-style-variant-repository'
import { ShowStyleVariant } from '../../../domain/entities/show-style-variant'
import { MongoShowStyle, RundownExecutionMongoEntityConverter } from './rundown-execution-mongo-entity-converter'

const COLLECTION_NAME: string = 'showStyleBases'

export class MongoShowStyleRepository extends BaseMongoRepository<MongoShowStyle> implements ShowStyleRepository {
  public constructor(
    mongoDatabase: MongoDatabase,
    private readonly showStyleVariantRepository: ShowStyleVariantRepository,
    private readonly rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getShowStyle(showStyleId: string): Promise<ShowStyle> {
    this.assertDatabaseConnection(this.getShowStyle.name)
    const mongoShowStyle: MongoShowStyle | null = await this.getCollection().findOne<MongoShowStyle>({
      _id: showStyleId,
    })
    if (!mongoShowStyle) {
      throw new NotFoundException(`No ShowStyle found for showStyleId: ${showStyleId}`)
    }

    const showStyleVariants: ShowStyleVariant[] = await this.showStyleVariantRepository.getShowStyleVariantsForShowStyle(showStyleId)
    return this.rundownExecutionMongoEntityConverter.convertShowStyle(mongoShowStyle, showStyleVariants)
  }
}
