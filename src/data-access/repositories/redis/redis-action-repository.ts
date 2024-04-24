import {ActionRepository} from '../interfaces/action-repository'
import {BaseRedisRepository} from './base-redis-repository'
import {RedisDatabase} from './redis-database'
import {Action} from '../../../model/entities/action'

export class RedisActionRepository extends BaseRedisRepository implements ActionRepository {

  constructor(redisDatabase: RedisDatabase) {
    super(redisDatabase)
  }

  public deleteActionsForRundown(rundownId: string): Promise<void> {
    this.db.scanStream({match: 'action-*'}).map(async ([key]) => {
      const actionId = key.split('-')[1]
      const action = await this.getAction(actionId)
      if (action.rundownId === rundownId) {
        this.db.del(key)
      }
    })
    return Promise.resolve(undefined)
  }

  public async getAction(actionId: string): Promise<Action> {
    const [actionString] = await Promise.all([this.db.get(`action-${actionId}`)])
    if (!actionString) {
      throw new Error(`Action with id ${actionId} not found`)
    }

    return Promise.resolve(<Action>JSON.parse(actionString))
  }

  public saveActions(actions: Action[]): Promise<void> {
    for (const action of actions) {
      this.db.set(`action-${action.id}`, JSON.stringify(action))
    }
    return Promise.resolve(undefined)
  }
}
