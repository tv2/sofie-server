import * as mongodb from 'mongodb'
import { Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../../../model/exceptions/database-not-connected-exception'
import { MongoId } from './mongo-entity-converter'
import { Logger } from '../../../logger/logger'
import { Database } from '../interfaces/database'

const MONGO_CONNECTION_STRING: string = process.env.MONGO_URL ?? 'mongodb://localhost:3001'
const MONGO_DB_NAME: string = getMongoDatabaseName()

function getMongoDatabaseName(): string {
  const mongoUrlPattern: RegExp = /^mongodb:\/\/\w+(:\d+)?\/(?<databaseName>[^/]+)/i
  return mongoUrlPattern.exec(MONGO_CONNECTION_STRING)?.groups?.databaseName ?? 'meteor'
}

export class MongoDatabase implements Database {
  private static instance: MongoDatabase

  public static getInstance(logger: Logger): MongoDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase(logger)
    }
    return this.instance
  }

  private readonly logger: Logger
  private client: mongodb.MongoClient
  private db: mongodb.Db

  private readonly onConnectCallbacks: Map<string, () => void> = new Map()

  private constructor(logger: Logger) {
    this.logger = logger.tag(MongoDatabase.name)
  }

  public async connect(): Promise<void> {
    await this.connectToMongoDatabase()
  }

  private async connectToMongoDatabase(): Promise<void> {
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
    if (this.db) {
      callback()
      return
    }
    this.onConnectCallbacks.set(callbackIdentifier, callback)
  }
}
