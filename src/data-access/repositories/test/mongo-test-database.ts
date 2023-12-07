import { MongoMemoryServer } from 'mongodb-memory-server'
import { Collection, Db, MongoClient } from 'mongodb'

const FIFTEEN_SECONDS_IN_MS: number = 15000

export class MongoTestDatabase {
  private mongoServer: MongoMemoryServer
  private client: MongoClient

  constructor() {
    // Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
    jest.setTimeout(FIFTEEN_SECONDS_IN_MS)
  }

  public async setupDatabaseServer(): Promise<void> {
    this.mongoServer = await MongoMemoryServer.create()
    this.client = await MongoClient.connect(this.mongoServer.getUri())
  }

  public async teardownDatabaseServer(): Promise<void> {
    if (this.client) {
      await this.client.close()
    }
    if (this.mongoServer) {
      await this.mongoServer.stop()
    }
  }

  public async dropDatabase(): Promise<void> {
    await this.getDatabase().dropDatabase()
  }

  public getDatabase(): Db {
    return this.client.db(this.mongoServer.instanceInfo!.dbName)
  }

  public async populateCollection<T extends object>(collectionName: string, objects: T[]): Promise<void> {
    const db: Db = this.getDatabase()
    const collection: Collection = db.collection(collectionName)
    await Promise.all(objects.map(async (object) => collection.insertOne(object)))
  }
}
