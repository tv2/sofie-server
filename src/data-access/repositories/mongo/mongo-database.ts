import * as mongodb from 'mongodb'
import { Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../../../model/exceptions/database-not-connected-exception'
import { MongoId } from './mongo-entity-converter'
import { LoggerService } from '../../../model/services/logger-service'

// TODO: Move to ENV variables
const MONGO_CONNECTION_STRING: string = 'mongodb://localhost:3001'
const MONGO_DB_NAME: string = 'meteor'

export class MongoDatabase {
  private static instance: MongoDatabase

  public static getInstance(loggerService: LoggerService): MongoDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase(loggerService)
    }
    return this.instance
  }

  private client: mongodb.MongoClient
  private db: mongodb.Db

  private readonly onConnectCallbacks: Map<string, () => void> = new Map()

  private constructor(private readonly loggerService: LoggerService) {
    this.loggerService.tag(MongoDatabase.name)
    this.connectToDatabase()
      .catch((reason) => this.loggerService.data(reason).error('Failed connecting to mongo database.'))
  }

  private async connectToDatabase(): Promise<void> {
    if (this.db) {
      this.loggerService.info('Already connected to database. Skipping reconnection...')
      return
    }

    this.client = new mongodb.MongoClient(MONGO_CONNECTION_STRING)
    await this.client.connect()

    this.db = this.client.db(MONGO_DB_NAME)
    this.loggerService.info(`Connected to database: ${this.db.databaseName}`)

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
