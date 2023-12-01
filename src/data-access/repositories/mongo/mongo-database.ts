import * as mongodb from 'mongodb'
import { Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../../../model/exceptions/database-not-connected-exception'
import { MongoId } from './mongo-entity-converter'
import { ConsoleLogger } from '../../../console-logger'
import { Logger } from '../../../logger'

// TODO: Move to ENV variables
const MONGO_CONNECTION_STRING: string = 'mongodb://localhost:3001'
const MONGO_DB_NAME: string = 'meteor'

export class MongoDatabase {
  private static instance: MongoDatabase

  public static getInstance(logger: ConsoleLogger): MongoDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase(logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private client: mongodb.MongoClient
  private db: mongodb.Db

  private readonly onConnectCallbacks: Map<string, () => void> = new Map()

  private constructor(logger: ConsoleLogger) {
    this.logger = logger.tag(MongoDatabase.name)
    this.connectToDatabase()
      .catch((reason) => this.logger.data(reason).error('Failed connecting to mongo database.'))
  }

  private async connectToDatabase(): Promise<void> {
    if (this.db) {
      this.logger.info('Already connected to database. Skipping reconnection...')
      return
    }

    this.client = new mongodb.MongoClient(MONGO_CONNECTION_STRING)
    await this.client.connect()

    this.db = this.client.db(MONGO_DB_NAME)
    this.logger.info(`Connected to database: ${this.db.databaseName}`)

    this.onConnectCallbacks.forEach(callback => callback())
  }

  public getCollection<Model extends MongoId = MongoId>(collectionName: string): Collection<Model> {
    this.assertDatabaseConnection()
    return this.db.collection<Model>(collectionName)
  }

  private assertDatabaseConnection(): void {
    if (!this.db) {
      throw new DatabaseNotConnectedException('Not connected to the database')
    }
  }

  public getDatabaseName(): string {
    return MONGO_DB_NAME
  }

  public onConnect(callbackIdentifier: string, callback: () => void): void {
    this.onConnectCallbacks.set(callbackIdentifier, callback)
  }
}
