import { MongoRundownRepository, RUNDOWN_COLLECTION_NAME } from '../mongo/mongo-rundown-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { SegmentRepository } from '../interfaces/segment-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, instance, mock, objectContaining, spy, verify, when } from '@typestrong/ts-mockito'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { Collection, Db } from 'mongodb'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { Rundown } from '../../../model/entities/rundown'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { PieceRepository } from '../interfaces/piece-repository'
import { MongoEntityConverter, MongoId, MongoRundown } from '../mongo/mongo-entity-converter'
import { RundownMode } from '../../../model/enums/rundown-mode'

const COLLECTION_NAME: string = RUNDOWN_COLLECTION_NAME

describe('', () => {
  it('', () => {
    // Necessary test to circumvent that the tests are run as an exported function
  })
})

export function runMongoRundownRepositoryTests(testDatabase: MongoTestDatabase): void {
  describe(MongoRundownRepository.prototype.deleteRundown.name, () => {
    it('deletes active rundown successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const rundownId: string = 'someRundownId'
      const mongoRundown: MongoRundown = createMongoRundown({
        _id: rundownId,
      })
      await testDatabase.populateCollection(COLLECTION_NAME,[mongoRundown])
      const testee: RundownRepository = createTestee()

      await expect(db.collection<MongoRundown>(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.not.toBeNull()
      await testee.deleteRundown(rundownId)
      await expect(db.collection<MongoRundown>(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.toBeNull()
    })

    it('deletes inactive rundown successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const rundownId: string = 'someRundownId'
      const mongoRundown: MongoRundown = createMongoRundown({
        _id: rundownId,
      })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])
      const testee: MongoRundownRepository = createTestee()

      await expect(db.collection<MongoRundown>(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.not.toBeNull()
      await testee.deleteRundown(rundownId)
      await expect(db.collection<MongoRundown>(COLLECTION_NAME).findOne({ _id: rundownId })).resolves.toBeNull()
    })

    it('calls deletion of segments', async () => {
      const segmentRepository: SegmentRepository = mock<SegmentRepository>()
      const rundownId: string = 'someRundownId'
      const mongoRundown: MongoRundown = createMongoRundown({
        _id: rundownId,
      })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])
      const testee: MongoRundownRepository = createTestee({
        segmentRepository: segmentRepository,
      })

      await testee.deleteRundown(rundownId)

      verify(segmentRepository.deleteSegmentsForRundown(anyString())).once()
    })

    it('does not delete, when nonexistent rundownId is given', async () => {
      const nonExistingId: string = 'nonExistingId'
      const rundownName: string = 'someName'
      const mongoRundown: MongoRundown = createMongoRundown({ name: rundownName })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])
      const db: Db = testDatabase.getDatabase()

      const testee: MongoRundownRepository = createTestee()
      await testee.deleteRundown(nonExistingId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
      await expect(db.collection(COLLECTION_NAME).findOne({ name: rundownName })).resolves.not.toBeNull()
    })

    it('deletes segments before rundown', async () => {
      const segmentRepository: SegmentRepository = mock<SegmentRepository>()
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const rundownId: string = 'someRundownId'
      const mongoRundown: MongoRundown = createMongoRundown({
        _id: rundownId,
      })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])
      const db: Db = testDatabase.getDatabase()
      const collection: Collection<MongoId> = db.collection(COLLECTION_NAME)
      const spiedCollection = spy(collection)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      const testee: MongoRundownRepository = createTestee({
        mongoDb: mongoDb,
        segmentRepository: segmentRepository,
      })

      await testee.deleteRundown(rundownId)

      verify(segmentRepository.deleteSegmentsForRundown(anyString())).calledBefore(
        spiedCollection.deleteOne(anything())
      )
    })
  })

  describe(MongoRundownRepository.prototype.saveRundown.name, () => {
    it('has rundown as not on air and saves the rundown as on air', async () => {
      const inactiveMongoRundown: MongoRundown = createMongoRundown({
        _id: 'rundownId',
      })
      const activeRundown: Rundown = EntityTestFactory.createRundown( {
        id: inactiveMongoRundown._id,
        mode: RundownMode.ACTIVE,
      })
      await testDatabase.populateCollection(COLLECTION_NAME, [inactiveMongoRundown])

      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection: Collection<MongoId> = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
        _id: activeRundown.id,
        mode: activeRundown.getMode(),
      } as unknown as MongoRundown)

      const testee: RundownRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.saveRundown(activeRundown)

      const result: MongoRundown = (await db
        .collection<MongoRundown>(COLLECTION_NAME)
        .findOne({ _id: activeRundown.id })) as unknown as MongoRundown
      expect(result.mode).toBe(RundownMode.ACTIVE)
    })

    it('has rundown as on air and saves the rundown as not on air', async () => {
      const activeMongoRundown: MongoRundown = createMongoRundown({ _id: 'rundownId' })
      const inactiveRundown: Rundown = EntityMockFactory.createRundown({
        id: activeMongoRundown._id,
        mode: RundownMode.INACTIVE,
      })
      await testDatabase.populateCollection(COLLECTION_NAME, [activeMongoRundown])

      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection: Collection<MongoId> = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoRundown(anything())).thenReturn({
        _id: inactiveRundown.id,
        isActive: inactiveRundown.isActive(),
      } as unknown as MongoRundown)

      const testee: RundownRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.saveRundown(inactiveRundown)

      const result: MongoRundown = (await db
        .collection<MongoRundown>(COLLECTION_NAME)
        .findOne({ _id: inactiveRundown.id })) as unknown as MongoRundown
      expect(result.mode).toBeFalsy()
    })
  })

  describe(MongoRundownRepository.prototype.getRundown.name, () => {
    it('throws exception, when nonexistent rundownId is given', async () => {
      const nonExistingId: string = 'nonExistingId'
      const mongoRundown: MongoRundown = createMongoRundown()
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])

      const testee: MongoRundownRepository = createTestee()

      await expect(testee.getRundown(nonExistingId)).rejects.toThrow(NotFoundException)
    })

    it('retrieves segments from the segment repository, when existing rundownId is given', async () => {
      const segmentRepository: SegmentRepository = mock<SegmentRepository>()
      const rundown: Rundown = EntityTestFactory.createRundown()
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(rundown)

      when(segmentRepository.getSegments(anyString())).thenResolve([])
      const testee: RundownRepository = createTestee({
        segmentRepository: segmentRepository,
        mongoConverter: mongoConverter
      })

      await testee.getRundown(rundown.id)

      verify(segmentRepository.getSegments(rundown.id)).once()
    })

    it('returns rundown, when existing rundownId is given', async () => {
      const rundown: Rundown = EntityTestFactory.createRundown()
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(rundown)
      const testee: RundownRepository = createTestee({mongoConverter: mongoConverter})

      const result: Rundown = await testee.getRundown(rundown.id)

      expect(result).not.toBeNull()
    })
  })

  function createMongoRundown(mongoRundownInterface?: Partial<MongoRundown>): MongoRundown {
    return {
      _id: mongoRundownInterface?._id ?? 'id' + Math.random(),
      name: mongoRundownInterface?.name ?? 'rundownName',
    } as MongoRundown
  }

  async function setupMongoConverter(rundown: Rundown, mongoRundown?: MongoRundown): Promise<MongoEntityConverter> {
    const mongoEntityConverter: MongoEntityConverter = mock(MongoEntityConverter)
    if (!mongoRundown) {
      mongoRundown = createMongoRundown({
        _id: rundown.id,
      })
    }

    when(mongoEntityConverter.convertToRundown(objectContaining(mongoRundown), anything(), anything())).thenReturn(rundown)
    await testDatabase.populateCollection(COLLECTION_NAME, [mongoRundown])
    return mongoEntityConverter
  }

  function createTestee(params: {
    mongoDb?: MongoDatabase
    mongoConverter?: MongoEntityConverter
    baselineRepository?: RundownBaselineRepository
    segmentRepository?: SegmentRepository
    pieceRepository?: PieceRepository
  } = {}): MongoRundownRepository {
    const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

    if (!params.mongoDb) {
      params.mongoDb = mock(MongoDatabase)
      when(params.mongoDb!.getCollection(COLLECTION_NAME)).thenReturn(
        testDatabase.getDatabase().collection(COLLECTION_NAME)
      )
    }

    if (!params.baselineRepository) {
      params.baselineRepository = mock<RundownBaselineRepository>()
      when(params.baselineRepository.getRundownBaseline(anyString())).thenResolve([])
    }

    if (!params.segmentRepository) {
      params.segmentRepository = mock<SegmentRepository>()
      when(params.segmentRepository.getSegments(anyString())).thenResolve([])
    }

    if (!params.pieceRepository) {
      params.pieceRepository = mock<PieceRepository>()
    }

    return new MongoRundownRepository(
      instance(params.mongoDb!),
      instance(mongoConverter),
      instance(params.segmentRepository),
      instance(params.pieceRepository)
    )
  }
}
