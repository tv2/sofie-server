import { MongoPieceRepository, PIECE_COLLECTION_NAME } from '../mongo/mongo-piece-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Db } from 'mongodb'
import { PieceRepository } from '../interfaces/piece-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Piece } from '../../../model/entities/piece'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { MongoEntityConverter, MongoPiece } from '../mongo/mongo-entity-converter'

const COLLECTION_NAME: string = PIECE_COLLECTION_NAME

describe('', () => {
  it('', () => {
    // Necessary test to circumvent that the tests are run as an exported function
  })
})

export function runMongoPieceRepositoryTests(testDatabase: MongoTestDatabase): void {
  describe(MongoPieceRepository.prototype.deletePiecesForPart.name, () => {
    it('deletes one pieces successfully', async () => {
      const db: Db = testDatabase.getDatabase()
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ partId })
      const piece: Piece = EntityMockFactory.createPiece({ partId })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoPiece])

      when(mongoConverter.convertToPieces(anything())).thenReturn([piece])
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
        createMongoPiece({ partId }),
        createMongoPiece({ partId }),
      ]
      const pieces: Piece[] = [
        EntityMockFactory.createPiece({ partId }),
        EntityMockFactory.createPiece({ partId }),
      ]
      await testDatabase.populateCollection(COLLECTION_NAME, mongoPieces)

      when(mongoConverter.convertToPieces(anything())).thenReturn(pieces)
      const testee: PieceRepository = createTestee({ mongoConverter })

      await testee.deletePiecesForPart(partId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(0)
    })

    it('does not deletes any pieces, when nonexistent partId is given', async () => {
      const nonExistingId: string = 'nonExistingId'
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ partId })
      await testDatabase.populateCollection(COLLECTION_NAME, [mongoPiece])
      const db: Db = testDatabase.getDatabase()

      const testee: PieceRepository = createTestee()
      await testee.deletePiecesForPart(nonExistingId)

      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
    })
  })

  describe(MongoPieceRepository.prototype.getPieces.name, () => {
    it('gets zero pieces from database when no pieces for given partId exist', async () => {
      const mongoPieces: MongoPiece[] = [createMongoPiece({ partId: 'somePartId' })]
      const nonExistingId: string = 'nonExistingId'
      await testDatabase.populateCollection(COLLECTION_NAME, mongoPieces)

      const testee: PieceRepository = createTestee()

      const result: Piece[] = await testee.getPieces(nonExistingId)

      expect(result).toHaveLength(0)
    })

    it('returns one piece when partId is given', async () => {
      const partId: string = 'somePartId'
      const pieces: Piece[] = [EntityTestFactory.createPiece({ partId })]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(pieces)

      const testee: PieceRepository = createTestee({ mongoConverter })

      const result: Piece[] = await testee.getPieces(partId)

      expect(result.length).toBe(pieces.length)
    })

    it('returns multiple pieces when partId is given', async () => {
      const partId: string = 'somePartId'
      const pieces: Piece[] = [EntityTestFactory.createPiece({ partId }), EntityTestFactory.createPiece({ partId })]
      const mongoConverter: MongoEntityConverter = await setupMongoConverter(pieces)

      const testee: PieceRepository = createTestee({ mongoConverter })

      const result: Piece[] = await testee.getPieces(partId)

      expect(result.length).toBe(pieces.length)
    })
  })

  function createMongoPiece(params: Partial<MongoPiece>): MongoPiece {
    return {
      _id: params._id ?? 'id' + Math.random(),
      name: params.name ?? 'name' + Math.random(),
      partId: params.partId ?? 'partId' + Math.floor(Math.random() * 10),
    } as MongoPiece
  }

  async function setupMongoConverter(pieces: Piece[], mongoPieces?: MongoPiece[]): Promise<MongoEntityConverter> {
    const mongoEntityConverter: MongoEntityConverter = mock(MongoEntityConverter)
    if (!mongoPieces) {
      mongoPieces = pieces.map(piece => createMongoPiece({ partId: piece.getPartId() }))
    }

    when(mongoEntityConverter.convertToPieces(anything())).thenReturn(pieces)
    await testDatabase.populateCollection(COLLECTION_NAME, mongoPieces)
    return mongoEntityConverter
  }

  function createTestee(params: {
    mongoDb?: MongoDatabase
    mongoConverter?: MongoEntityConverter
  } = {}): MongoPieceRepository {
    const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)

    when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

    if (!params.mongoConverter) {
      params.mongoConverter = mock(MongoEntityConverter)
      when(params.mongoConverter.convertToPieces(anything())).thenReturn([])
    }

    return new MongoPieceRepository(instance(mongoDb), instance(params.mongoConverter))
  }
}
