import { MongoTestDatabase } from './mongo-test-database'
import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { runMongoRundownRepositoryTests } from './mongo-rundown-repository-tests'
import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { runMongoSegmentRepositoryTests } from './mongo-segment-repository-tests'
import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { runMongoPartRepositoryTests } from './mongo-part-repository-tests'
import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { runMongoPieceRepositoryTests } from './mongo-piece-repository-tests'

describe('Mongo repositories', () => {
  const testDatabase: MongoTestDatabase = new MongoTestDatabase()
  beforeAll(() => testDatabase.setupDatabaseServer())
  afterAll(() => testDatabase.teardownDatabaseServer())
  afterEach(() => testDatabase.dropDatabase())

  describe(MongoRundownRepository.name, () => runMongoRundownRepositoryTests(testDatabase))
  describe(MongoSegmentRepository.name, () => runMongoSegmentRepositoryTests(testDatabase))
  describe(MongoPartRepository.name, () => runMongoPartRepositoryTests(testDatabase))
  describe(MongoPieceRepository.name, () => runMongoPieceRepositoryTests(testDatabase))
})