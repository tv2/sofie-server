import { ShowStyleVariantRepository } from '../interfaces/show-style-variant-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { RundownRepository } from '../interfaces/rundown-repository'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Rundown } from '../../../model/entities/rundown'
import { MongoEntityConverter, MongoShowStyleVariant } from './mongo-entity-converter'

const COLLECTION_NAME: string = 'showStyleVariants'

export class MongoShowStyleVariantRepository extends BaseMongoRepository implements ShowStyleVariantRepository{

  constructor(
    mongoDatabase: MongoDatabase,
    private readonly mongoEntityConverter: MongoEntityConverter,
    private readonly rundownRepository: RundownRepository
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getShowStyleVariant(rundownId: string): Promise<ShowStyleVariant> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const mongoShowStyleVariant: MongoShowStyleVariant | null = await this.getCollection().findOne<MongoShowStyleVariant>({ _id: rundown.getShowStyleVariantId() })
    if (!mongoShowStyleVariant) {
      throw new NotFoundException(`No ShowStyleVariant found for rundownId: ${rundownId}`)
    }
    return this.mongoEntityConverter.convertShowStyleVariant(mongoShowStyleVariant)
  }

}
