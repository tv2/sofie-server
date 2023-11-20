import { MongoTestDatabase } from './mongo-test-database'
import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { MongoRundownRepositoryTests } from './mongo-rundown-repository'
import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { MongoSegmentRepositoryTests } from './mongo-segment-repository'
import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { MongoPartRepositoryTests } from './mongo-part-repository'
import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { MongoPieceRepositoryTests } from './mongo-piece-repository'

describe('Mongo Repositories', () => {
  const testDatabase: MongoTestDatabase = new MongoTestDatabase()
  beforeAll(async () => testDatabase.setupDatabaseConnection())
  afterAll(async () => testDatabase.teardownDatabaseConnection())
  afterEach(() => testDatabase.teardownDatabase())

  describe(MongoRundownRepository.name, () => MongoRundownRepositoryTests(testDatabase))
  describe(MongoSegmentRepository.name, () => MongoSegmentRepositoryTests(testDatabase))
  describe(MongoPartRepository.name, () => MongoPartRepositoryTests(testDatabase))
  describe(MongoPieceRepository.name, () => MongoPieceRepositoryTests(testDatabase))
})