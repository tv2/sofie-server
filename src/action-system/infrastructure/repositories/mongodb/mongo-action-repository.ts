import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { ActionRepository } from '../../../domain/repositories/action-repository'
import { Action } from '../../../domain/entities/action'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { DeleteResult, UnorderedBulkOperation } from 'mongodb'
import { DeletionFailedException } from '../../../../rundown-execution/domain/exceptions/deletion-failed-exception'
import { NotFoundException } from '../../../../rundown-execution/domain/exceptions/not-found-exception'
import { MongoAction, MongoEntityConverter } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'

const COLLECTION_NAME: string = 'actions'

export class MongoActionRepository extends BaseMongoRepository<MongoAction> implements ActionRepository {
  public constructor(
    private readonly mongoEntityConverter: MongoEntityConverter,
    mongoDatabase: MongoDatabase,
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getAction(actionId: string): Promise<Action> {
    this.assertDatabaseConnection(this.getAction.name)
    const action: MongoAction | null = await this.getCollection().findOne<MongoAction>({ _id: actionId })
    if (action === null) {
      throw new NotFoundException(`No Action found for ActionId ${actionId}`)
    }
    return this.mongoEntityConverter.convertToAction(action)
  }

  public async getSystemActions(): Promise<Action[]> {
    this.assertDatabaseConnection(this.getSystemActions.name)
    return this.getCollection()
      .find<MongoAction>({ rundownId: { $exists: false } })
      .map(mongoAction => this.mongoEntityConverter.convertToAction(mongoAction))
      .toArray()
  }

  public async getActionsForRundown(rundownId: string): Promise<Action[]> {
    this.assertDatabaseConnection(this.getActionsForRundown.name)
    const systemActions: Action[] = await this.getSystemActions()
    const rundownActions: Action[] = await this.getCollection()
      .find<MongoAction>({ rundownId: rundownId })
      .map(mongoAction => this.mongoEntityConverter.convertToAction(mongoAction))
      .toArray()
    return systemActions.concat(rundownActions)
  }

  public async saveActions(actions: Action[]): Promise<void> {
    this.assertDatabaseConnection(this.saveActions.name)
    const bulkOperation: UnorderedBulkOperation = this.getCollection().initializeUnorderedBulkOp({ ignoreUndefined: true })
    actions.forEach(action => bulkOperation.find({ _id: action.id }).upsert().replaceOne(this.mongoEntityConverter.convertToMongoAction(action)))
    await bulkOperation.execute()
  }

  public async deleteActionsNotOnRundowns(): Promise<void> {
    await this.getCollection().deleteMany({ rundownId: { $exists: false } })
  }

  public async deleteActionsForRundown(rundownId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteActionsForRundown.name)
    const actionsDeleteResult: DeleteResult = await this.getCollection().deleteMany({ rundownId })

    if (!actionsDeleteResult.acknowledged) {
      throw new DeletionFailedException(`Failed to delete Actions for Rundown: ${rundownId}`)
    }
  }
}
