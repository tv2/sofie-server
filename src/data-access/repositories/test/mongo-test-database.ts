import { MongoMemoryServer } from 'mongodb-memory-server'
import { Db, MongoClient } from 'mongodb'
import { MongoPart, MongoPiece, MongoRundown, MongoSegment } from '../mongo/mongo-entity-converter'
import { createHash } from 'crypto'

export class MongoTestDatabase {
  private mongoServer: MongoMemoryServer
  private client: MongoClient

  constructor() {
    // Set a timeout beyond the default of 5 Seconds to ensure CI tests don't exceed the limit on GitHub
    jest.setTimeout(15000)
  }

  public async setupDatabaseConnection(): Promise<void> {
    this.mongoServer = await MongoMemoryServer.create()
    this.client = await MongoClient.connect(this.mongoServer.getUri())
  }

  public async teardownDatabaseConnection(): Promise<void> {
    if (this.client) {
      await this.client.close()
    }
    if (this.mongoServer) {
      await this.mongoServer.stop()
    }
  }

  public async teardownDatabase(seed: string): Promise<void> {
    await this.getDatabase(seed).dropDatabase()
  }

  public getDatabase(seed: string): Db {
    return this.client.db(this.getHashedValue(seed))
  }

  private getHashedValue(valueToBeHashed: string ): string {
    return createHash('md5').update(valueToBeHashed).digest('hex')
  }

  public async populateDatabaseWithActiveRundowns(seed: string, rundowns: MongoRundown[]): Promise<void> {
    const db: Db = this.getDatabase(seed)
    const rundownsCollection = db.collection('rundowns')
    await Promise.all(rundowns.map(async (rundown) => rundownsCollection.insertOne(rundown as object)))
  }

  public async populateDatabaseWithInactiveRundowns(seed: string, rundowns: MongoRundown[]): Promise<void> {
    const db: Db = this.getDatabase(seed)
    for (const rundown of rundowns) {
      await db.collection('rundowns').insertOne(rundown as object)
      await db.collection('rundownPlaylists').insertOne({
        externalId: rundown.name,
      })
    }
  }

  public async populateDatabaseWithSegments(seed: string, segments: MongoSegment[]): Promise<void> {
    const db: Db = this.getDatabase(seed)
    const segmentsCollection = db.collection('segments')
    await Promise.all(segments.map(async (segment) => segmentsCollection.insertOne(segment as object)))
  }

  public async populateDatabaseWithParts(seed: string, parts: MongoPart[]): Promise<void> {
    const db: Db = this.getDatabase(seed)
    const partsCollection = db.collection('parts')
    await Promise.all(parts.map(async (part) => partsCollection.insertOne(part as object)))
  }

  public async populateDatabaseWithPieces(seed: string, pieces: MongoPiece[]): Promise<void> {
    const db: Db = this.getDatabase(seed)
    const piecesCollection = db.collection('pieces')
    await Promise.all(pieces.map(async (piece) => piecesCollection.insertOne(piece as object)))
  }
}
