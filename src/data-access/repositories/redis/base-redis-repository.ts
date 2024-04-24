import {RedisDatabase} from './redis-database'
import Redis from 'ioredis'

export abstract class BaseRedisRepository {
  protected readonly db: Redis
  protected constructor(protected redisDatabase: RedisDatabase) {
    this.db = redisDatabase.getDb()
  }
}
