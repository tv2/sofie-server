import {Database} from '../interfaces/database'
import {Logger} from '../../../logger/logger'
import Redis, {RedisOptions} from 'ioredis'

const REDIS_HOST: string = process.env.REDIS_HOST ?? '127.0.0.1'
const REDIS_PORT: number = parseInt(process.env.REDIS_PORT ?? '6379',10)
const REDIS_DB_NAME: number = 0

export class RedisDatabase implements Database {

  private static instance: RedisDatabase

  public static getInstance(logger: Logger): RedisDatabase {
    if (!this.instance) {
      this.instance = new RedisDatabase(logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private readonly options: RedisOptions = {
    port: REDIS_PORT,
    host: REDIS_HOST,
    db: REDIS_DB_NAME,
    tls: {},
    showFriendlyErrorStack: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  }
  private db: Redis

  private readonly onConnectCallbacks: Map<string, () => void> = new Map()

  private constructor(logger: Logger) {
    this.logger = logger.tag(RedisDatabase.name)
  }
  public async connect(): Promise<void> {
    await this.connectToRedisDatabase()
  }

  private async connectToRedisDatabase(): Promise<void> {
    if (this.db) {
      this.logger.info('Already connected to database. Skipping reconnection...')
      return
    }

    this.db = new Redis(this.options)
    await this.db.connect()

    this.logger.info(`Connected to database: redis://${this.db.options.host}:${this.db.options.port}/${this.db.options.db}`)
    this.onConnectCallbacks.forEach(callback => callback())
  }

  public getDb(): Redis {
    return this.db
  }
}
