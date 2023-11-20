import { MongoTestDatabase } from './mongo-test-database'
import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { RunMongoRundownRepositoryTests } from './mongo-rundown-repository-tests'
import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { RunMongoSegmentRepositoryTests } from './mongo-segment-repository-tests'
import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { RunMongoPartRepositoryTests } from './mongo-part-repository-tests'
import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { RunMongoPieceRepositoryTests } from './mongo-piece-repository-tests'

describe('Mongo repositories', () => {
  const testDatabase: MongoTestDatabase = new MongoTestDatabase()
  beforeAll(() => testDatabase.setupDatabaseServer())
  afterAll(() => testDatabase.teardownDatabaseServer())
  afterEach(() => testDatabase.dropDatabase())

  describe(MongoRundownRepository.name, () => RunMongoRundownRepositoryTests(testDatabase))
  describe(MongoSegmentRepository.name, () => RunMongoSegmentRepositoryTests(testDatabase))
  describe(MongoPartRepository.name, () => RunMongoPartRepositoryTests(testDatabase))
  describe(MongoPieceRepository.name, () => RunMongoPieceRepositoryTests(testDatabase))
})