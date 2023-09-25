import { MongoPartRepository } from '../mongo/mongo-part-repository'
import { Part } from '../../../model/entities/part'
import { Db } from 'mongodb'
import { MongoEntityConverter, MongoPart } from '../mongo/mongo-entity-converter'
import { PartRepository } from '../interfaces/part-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { anyString, anything, capture, instance, mock, spy, verify, when } from '@typestrong/ts-mockito'
import { MongoTestDatabase } from './mongo-test-database'
import { PieceRepository } from '../interfaces/piece-repository'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { EntityFactory } from '../../../model/entities/test/entity-factory'

const COLLECTION_NAME = 'parts'

describe(`${MongoPartRepository.name}`, () => {
  const testDatabase: MongoTestDatabase = new MongoTestDatabase()
  beforeEach(async () => testDatabase.setupDatabase())
  afterEach(async () => testDatabase.teardownDatabase())

  describe(`${MongoPartRepository.prototype.deletePartsForSegment.name}`, () => {
    it('deletes one part successfully', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const segmentId: string = 'someSegmentId'
      const part: MongoPart = createMongoPart({ segmentId: segmentId })
      const entityPart: Part = EntityMockFactory.createPart({ segmentId: segmentId })
      await testDatabase.populateDatabaseWithParts([part])
      const db: Db = testDatabase.getDatabase()

      when(mongoConverter.convertParts(anything())).thenReturn([entityPart])
      const testee: PartRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.deletePartsForSegment(segmentId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
    })

    it('deletes multiple parts successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const segmentId: string = 'someSegmentId'
      const mongoParts: MongoPart[] = [
        createMongoPart({ segmentId: segmentId }),
        createMongoPart({ segmentId: segmentId }),
      ]
      const parts: Part[] = [
        EntityMockFactory.createPart({ segmentId: segmentId }),
        EntityMockFactory.createPart({ segmentId: segmentId }),
      ]
      await testDatabase.populateDatabaseWithParts(mongoParts)

      when(mongoConverter.convertParts(anything())).thenReturn(parts)
      const testee: PartRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.deletePartsForSegment(segmentId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
    })

    it('calls deletion of pieces, matching amount of parts', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const pieceRepository: PieceRepository = mock<PieceRepository>()
      const segmentId: string = 'someSegmentId'
      const mongoParts: MongoPart[] = [
        createMongoPart({ segmentId: segmentId }),
        createMongoPart({ segmentId: segmentId }),
      ]
      const parts: Part[] = [
        EntityMockFactory.createPart({ segmentId: segmentId }),
        EntityMockFactory.createPart({ segmentId: segmentId }),
      ]
      await testDatabase.populateDatabaseWithParts(mongoParts)

      when(mongoConverter.convertParts(anything())).thenReturn(parts)
      when(pieceRepository.getPieces(anything())).thenResolve([])
      const testee: PartRepository = createTestee({
        mongoConverter: mongoConverter,
        pieceRepository: pieceRepository,
      })

      await testee.deletePartsForSegment(segmentId)

      verify(pieceRepository.deletePiecesForPart(anyString())).times(mongoParts.length)
    })

    it('does not deletes any pieces, when nonexistent segmentId is given', async () => {
      const nonExistingId: string = 'nonExistingId'
      const mongoPart: MongoPart = createMongoPart({})
      await testDatabase.populateDatabaseWithParts([mongoPart])
      const db = testDatabase.getDatabase()

      const testee = createTestee({ })
      await testee.deletePartsForSegment(nonExistingId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
    })

    it('deletes pieces before parts', async () => {
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const pieceRepository: PieceRepository = mock<PieceRepository>()
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const segmentId: string = 'someSegmentId'
      const mongoPart: MongoPart = createMongoPart({ segmentId: segmentId })
      const part: Part = EntityMockFactory.createPart({ segmentId: segmentId })
      await testDatabase.populateDatabaseWithParts([mongoPart])
      const db: Db = testDatabase.getDatabase()
      const collection = db.collection(COLLECTION_NAME)
      const spiedCollection = spy(collection)

      when(mongoConverter.convertParts(anything())).thenReturn([part])
      when(pieceRepository.getPieces(anything())).thenResolve([])
      when(mongoDb.getCollection(anything())).thenReturn(collection)
      const testee: PartRepository = createTestee({
        mongoConverter: mongoConverter,
        mongoDb: mongoDb,
        pieceRepository: pieceRepository,
      })

      await testee.deletePartsForSegment(segmentId)

      verify(pieceRepository.deletePiecesForPart(anything())).calledBefore(spiedCollection.deleteMany(anything()))
    })
  })

  describe(`${MongoPartRepository.prototype.savePart.name}`, () => {
    it('has part as not on air and saves the part as on air', async () => {
      const inactiveMongoPart: MongoPart = createMongoPart({ _id: 'randomId', isOnAir: false })
      const onAirPart: Part = EntityMockFactory.createPart({ id: inactiveMongoPart._id, isOnAir: true })

      await testDatabase.populateDatabaseWithParts([inactiveMongoPart])
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoPart(anything())).thenReturn({
        _id: onAirPart.id,
        isOnAir: onAirPart.isOnAir(),
      } as MongoPart)

      const testee: PartRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.savePart(onAirPart)

      const result: MongoPart = (await db
        .collection(COLLECTION_NAME)
        .findOne({ _id: onAirPart.id })) as unknown as MongoPart
      expect(result.isOnAir).toBeTruthy()
    })

    it('has part as on air and saves the part as not on air', async () => {
      const onAirMongoPart: MongoPart = createMongoPart({ _id: 'randomId', isOnAir: true })
      const inactivePart: Part = EntityMockFactory.createPart({ id: onAirMongoPart._id, isOnAir: false })

      await testDatabase.populateDatabaseWithParts([onAirMongoPart])
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoPart(anything())).thenReturn({
        _id: inactivePart.id,
        isOnAir: inactivePart.isOnAir(),
      } as MongoPart)

      const testee: PartRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.savePart(inactivePart)

      const result: MongoPart = (await db
        .collection(COLLECTION_NAME)
        .findOne({ _id: inactivePart.id })) as unknown as MongoPart
      expect(result.isOnAir).toBeFalsy()
    })

    it('does not have part as next but saves the part as next', async () => {
      const nonQueuedMongoPart: MongoPart = createMongoPart({ _id: 'randomId', isNext: false })
      const nextPart: Part = EntityMockFactory.createPart({ id: nonQueuedMongoPart._id, isNext: true })

      await testDatabase.populateDatabaseWithParts([nonQueuedMongoPart])
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoPart(anything())).thenReturn({
        _id: nextPart.id,
        isNext: nextPart.isNext(),
      } as MongoPart)

      const testee: PartRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.savePart(nextPart)

      const result: MongoPart = (await db
        .collection(COLLECTION_NAME)
        .findOne({ _id: nextPart.id })) as unknown as MongoPart
      expect(result.isNext).toBeTruthy()
    })

    it('has part as next and saves the part as no longer next', async () => {
      const nextMongoPart: MongoPart = createMongoPart({ _id: 'randomId', isNext: true })
      const nonQueuedPart: Part = EntityMockFactory.createPart({ id: nextMongoPart._id, isNext: false })

      await testDatabase.populateDatabaseWithParts([nextMongoPart])
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoDb: MongoDatabase = mock(MongoDatabase)
      const db: Db = testDatabase.getDatabase()
      const collection = db.collection(COLLECTION_NAME)

      when(mongoDb.getCollection(anything())).thenReturn(collection)
      when(mongoConverter.convertToMongoPart(anything())).thenReturn({
        _id: nonQueuedPart.id,
        isNext: nonQueuedPart.isNext(),
      } as MongoPart)

      const testee: PartRepository = createTestee({
        mongoDb: mongoDb,
        mongoConverter: mongoConverter,
      })
      await testee.savePart(nonQueuedPart)

      const result: MongoPart = (await db
        .collection(COLLECTION_NAME)
        .findOne({ _id: nonQueuedPart.id })) as unknown as MongoPart
      expect(result.isNext).toBeFalsy()
    })
  })

  describe(`${MongoPartRepository.prototype.getParts.name}`, () => {
    it('gets zero parts from database when no parts for given segmentId exist', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoParts: MongoPart[] = [createMongoPart({segmentId: 'someSegmentId'})]
      const nonExistingId: string = 'nonExistingId'
      const db: Db = testDatabase.getDatabase()
      await testDatabase.populateDatabaseWithParts(mongoParts)

      when(mongoConverter.convertParts(anything())).thenReturn([])
      const testee: PartRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.getParts(nonExistingId)

      const [capturedMongoParts] =  capture(mongoConverter.convertParts).first()
      expect(capturedMongoParts.length).toBe(0)
      expect((await db.collection(COLLECTION_NAME).find().toArray()).length).toBe(1)
    })

    it('returns one part when segmentId is given', async () => {
      const segmentId: string = 'someSegmentId'
      const parts: Part[] = [EntityFactory.createPart({segmentId: segmentId})]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(parts)

      const testee: PartRepository = createTestee({mongoConverter: mongoConverter})

      const result: Part[] = await testee.getParts(segmentId)

      expect(result.length).toBe(parts.length)
    })

    it('returns multiple parts when segmentId is given', async () => {
      const segmentId: string = 'someSegmentId'
      const parts: Part[] = [EntityFactory.createPart({segmentId: segmentId}), EntityFactory.createPart({segmentId: segmentId})]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(parts)

      const testee: PartRepository = createTestee({mongoConverter: mongoConverter})

      const result: Part[] = await testee.getParts(segmentId)

      expect(result.length).toBe(parts.length)
    })

    it('retrieves pieces equal times to amount of parts retrieved', async () => {
      const pieceRepository: PieceRepository = mock<PieceRepository>()
      const segmentId: string = 'someSegmentId'
      const parts: Part[] = [EntityFactory.createPart({segmentId: segmentId}), EntityFactory.createPart({segmentId: segmentId})]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(parts)

      when(pieceRepository.getPieces(anyString())).thenResolve([])
      const testee: PartRepository = createTestee({
        pieceRepository: pieceRepository, mongoConverter: mongoConverter
      })

      await testee.getParts(segmentId)

      verify(pieceRepository.getPieces(anyString())).times(parts.length)
    })

  })

  function createMongoPart(mongoPartInterface?: Partial<MongoPart>): MongoPart {
    return {
      _id: mongoPartInterface?._id ?? 'id' + Math.random(),
      title: mongoPartInterface?.title ?? 'partTitle',
      _rank: mongoPartInterface?._rank ?? Math.random() * 100,
      segmentId: mongoPartInterface?.segmentId ?? 'segmentId' + Math.floor(Math.random() * 10),
    } as MongoPart
  }

  async function setupMongoConverter(parts: Part[], mongoParts?: MongoPart[]): Promise<MongoEntityConverter> {
    const mongoEntityConverter: MongoEntityConverter = mock(MongoEntityConverter)
    if (!mongoParts) {
      mongoParts = parts.map(segment => createMongoPart({segmentId: segment.segmentId}))
    }

    when(mongoEntityConverter.convertParts(anything())).thenReturn(parts)
    await testDatabase.populateDatabaseWithParts(mongoParts)
    return mongoEntityConverter
  }

  function createTestee(params: {
    pieceRepository?: PieceRepository
    mongoDb?: MongoDatabase
    mongoConverter?: MongoEntityConverter
  }): MongoPartRepository {
    const pieceRepository: PieceRepository = params.pieceRepository ?? mock<PieceRepository>()

    if (!params.mongoDb) {
      params.mongoDb = mock(MongoDatabase)
      when(params.mongoDb.getCollection(COLLECTION_NAME)).thenReturn(
        testDatabase.getDatabase().collection(COLLECTION_NAME)
      )
    }

    if (!params.mongoConverter) {
      params.mongoConverter = mock(MongoEntityConverter)
      when(params.mongoConverter.convertParts(anything())).thenReturn([])
    }

    return new MongoPartRepository(instance(params.mongoDb), instance(params.mongoConverter), instance(pieceRepository))
  }
})
