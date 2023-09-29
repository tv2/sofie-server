import { ShowStyleVariantRepository } from '../interfaces/show-style-variant-repository'
import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter } from './mongo-entity-converter'
import { RundownRepository } from '../interfaces/rundown-repository'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'

const COLLECTION_NAME: string = 'showStyleVariants'

export class MongoShowStyleVariantRepository extends BaseMongoRepository implements ShowStyleVariantRepository{
  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly rundownRepository: RundownRepository
  ) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getShowStyleVariant(rundownId: string): Promise<ShowStyleVariant> {
    const rundown = await this.rundownRepository.getRundown(rundownId)
    const showStyleVariant: ShowStyleVariant | null = await this.getCollection().findOne<ShowStyleVariant>({_id: rundown.getShowStyleVariantId})
    if (!showStyleVariant) {
      throw new NotFoundException(`No ShowStyleVariant found for rundownId: ${rundownId}`)
    }
    return showStyleVariant
  }

}