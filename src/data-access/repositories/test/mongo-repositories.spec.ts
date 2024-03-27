import { MongoTestDatabase } from './mongo-test-database'
import { MongoRundownRepository } from '../mongo/mongo-rundown-repository'
import { runMongoRundownRepositoryTests } from './mongo-rundown-repository.spec'
import { MongoSegmentRepository } from '../mongo/mongo-segment-repository'
import { runMongoSegmentRepositoryTests } from './mongo-segment-repository.spec'
import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { runMongoPartRepositoryTests } from './mongo-part-repository.spec'
import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { runMongoPieceRepositoryTests } from './mongo-piece-repository.spec'

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
