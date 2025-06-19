import { ShowStyleVariantRepository } from '../../../domain/repositories/show-style-variant-repository'
import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { RundownRepository } from '../../../domain/repositories/rundown-repository'
import { ShowStyleVariant } from '../../../domain/entities/show-style-variant'
import { NotFoundException } from '../../../domain/exceptions/not-found-exception'
import { Rundown } from '../../../domain/entities/rundown'
import { MongoEntityConverter, MongoShowStyleVariant } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'showStyleVariants'

export class MongoShowStyleVariantRepository extends BaseMongoRepository<MongoShowStyleVariant> implements ShowStyleVariantRepository {
  public constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoEntityConverter: MongoEntityConverter,
    private readonly rundownRepository: RundownRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getShowStyleVariantsForShowStyle(showStyleId: string): Promise<ShowStyleVariant[]> {
    const mongoShowStyleVariants: MongoShowStyleVariant[] = await this.getCollection().find<MongoShowStyleVariant>({ showStyleBaseId: showStyleId }).toArray()
    return this.mongoEntityConverter.convertShowStyleVariants(mongoShowStyleVariants)
  }

  public async getShowStyleVariant(rundownId: string): Promise<ShowStyleVariant> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const mongoShowStyleVariant: MongoShowStyleVariant | null = await this.getCollection().findOne<MongoShowStyleVariant>({ _id: rundown.getShowStyleVariantId() })
    if (!mongoShowStyleVariant) {
      throw new NotFoundException(`No show style variant found for rundown '${rundown.name}' with id '${rundownId}'.`)
    }
    return this.mongoEntityConverter.convertShowStyleVariant(mongoShowStyleVariant)
  }
}
