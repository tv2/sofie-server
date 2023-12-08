import * as mongodb from 'mongodb'
import { Collection } from 'mongodb'
import { DatabaseNotConnectedException } from '../../../model/exceptions/database-not-connected-exception'
import { MongoId } from './mongo-entity-converter'

const MONGO_CONNECTION_STRING: string = process.env.MONGO_URL ?? 'mongodb://localhost:3001'
const MONGO_DB_NAME: string = getMongoDatabaseName()

function getMongoDatabaseName(): string {
  const mongoUrlPattern: RegExp = /^mongodb:\/\/\w+(:\d+)?\/(?<databaseName>[^/]+)/i
  return mongoUrlPattern.exec(MONGO_CONNECTION_STRING)?.groups?.databaseName ?? 'meteor'
}

export class MongoDatabase {
  private static instance: MongoDatabase

  public static getInstance(): MongoDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase()
    }
    return this.instance
  }

  private client: mongodb.MongoClient
  private db: mongodb.Db

  private readonly onConnectCallbacks: Map<string, () => void> = new Map()

  private constructor() {
    this.connectToDatabase()
      .catch((reason) => console.error('Failed connecting to mongo database.', reason))
  }

  private async connectToDatabase(): Promise<void> {
    if (this.db) {
      console.log('### Already connected to database. Skipping reconnection...')
      return
    }

    this.client = new mongodb.MongoClient(MONGO_CONNECTION_STRING)
    await this.client.connect()

    this.db = this.client.db(MONGO_DB_NAME)
    console.log(`### Connected to database: ${this.db.databaseName}`)

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
