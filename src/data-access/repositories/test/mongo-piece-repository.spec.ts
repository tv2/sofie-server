import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { MongoEntityConverter, MongoPiece } from '../mongo/mongo-entity-converter'
import { anything, capture, instance, mock, when } from '@typestrong/ts-mockito'
import { Db } from 'mongodb'
import { PieceRepository } from '../interfaces/piece-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Piece } from '../../../model/entities/piece'
import { EntityFactory } from '../../../model/entities/test/entity-factory'

const COLLECTION_NAME = 'pieces'

describe(`${MongoPieceRepository.name}`, () => {
  const testDatabase: MongoTestDatabase = new MongoTestDatabase()
  beforeEach(async () => testDatabase.setupDatabase())
  afterEach(async () => testDatabase.teardownDatabase())

  describe(`${MongoPieceRepository.prototype.deletePiecesForPart.name}`, () => {
    it('deletes one pieces successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ startPartId: partId })
      const piece: Piece = EntityMockFactory.createPiece({ partId: partId })
      await testDatabase.populateDatabaseWithPieces([mongoPiece])

      when(mongoConverter.convertPieces(anything())).thenReturn([piece])
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.deletePiecesForPart(partId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
    })

    it('deletes multiple pieces successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPieces: MongoPiece[] = [
        createMongoPiece({ startPartId: partId }),
        createMongoPiece({ startPartId: partId }),
      ]
      const pieces: Piece[] = [
        EntityMockFactory.createPiece({ partId: partId }),
        EntityMockFactory.createPiece({ partId: partId }),
      ]
      await testDatabase.populateDatabaseWithPieces(mongoPieces)

      when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.deletePiecesForPart(partId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
    })

    it('does not deletes any pieces, when nonexistent partId is given', async () => {
      const nonExistingId: string = 'nonExistingId'
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ startPartId: partId })
      await testDatabase.populateDatabaseWithPieces([mongoPiece])
      const db: Db = testDatabase.getDatabase()

      const testee: PieceRepository = createTestee({ })
      await testee.deletePiecesForPart(nonExistingId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
    })
  })

  describe(`${MongoPieceRepository.prototype.getPieces.name}`, () => {
    it('gets zero pieces from database when no pieces for given partId exist', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const mongoPieces: MongoPiece[] = [createMongoPiece({startPartId: 'somePartId'})]
      const nonExistingId: string = 'nonExistingId'
      const db: Db = testDatabase.getDatabase()
      await testDatabase.populateDatabaseWithPieces(mongoPieces)

      when(mongoConverter.convertPieces(anything())).thenReturn([])
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.getPieces(nonExistingId)

      const [capturedMongoPieces] =  capture(mongoConverter.convertPieces).first()
      expect(capturedMongoPieces.length).toBe(0)
      expect((await db.collection(COLLECTION_NAME).find().toArray()).length).toBe(1)
    })

    it('returns one piece when partId is given', async () => {
      const partId: string = 'somePartId'
      const pieces: Piece[] = [EntityFactory.createPiece({partId: partId})]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(pieces)

      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      const result: Piece[] = await testee.getPieces(partId)

      expect(result.length).toBe(pieces.length)
    })

    it('returns multiple pieces when partId is given', async () => {
      const partId: string = 'somePartId'
      const pieces: Piece[] = [EntityFactory.createPiece({partId: partId}), EntityFactory.createPiece({partId: partId})]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(pieces)

      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      const result: Piece[] = await testee.getPieces(partId)

      expect(result.length).toBe(pieces.length)
    })
  })

  function createMongoPiece(params: Partial<MongoPiece>): MongoPiece {
    return {
      _id: params._id ?? 'id' + Math.random(),
      name: params.name ?? 'name' + Math.random(),
      startPartId: params.startPartId ?? 'partId' + Math.floor(Math.random() * 10),
    } as MongoPiece
  }

  async function setupMongoConverter(pieces: Piece[], mongoPieces?: MongoPiece[]): Promise<MongoEntityConverter> {
    const mongoEntityConverter: MongoEntityConverter = mock(MongoEntityConverter)
    if (!mongoPieces) {
      mongoPieces = pieces.map(piece => createMongoPiece({startPartId: piece.partId}))
    }

    when(mongoEntityConverter.convertPieces(anything())).thenReturn(pieces)
    await testDatabase.populateDatabaseWithPieces(mongoPieces)
    return mongoEntityConverter
  }

  function createTestee(params: {
    mongoDb?: MongoDatabase
    mongoConverter?: MongoEntityConverter
  }): MongoPieceRepository {
    const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)

    when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

    if (!params.mongoConverter) {
      params.mongoConverter = mock(MongoEntityConverter)
      when(params.mongoConverter.convertPieces(anything())).thenReturn([])
    }

    return new MongoPieceRepository(instance(mongoDb), instance(params.mongoConverter))
  }
})
