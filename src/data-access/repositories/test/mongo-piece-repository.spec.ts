import { MongoPieceRepository } from '../mongo/mongo-piece-repository'
import { MongoTestDatabase } from './mongo-test-database'
import { MongoEntityConverter, MongoPiece } from '../mongo/mongo-entity-converter'
import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Db } from 'mongodb'
import { PieceRepository } from '../interfaces/piece-repository'
import { MongoDatabase } from '../mongo/mongo-database'
import { DeletionFailedException } from '../../../model/exceptions/deletion-failed-exception'
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

    it('throws exception, when nonexistent partId is given', async () => {
      const expectedErrorMessageFragment: string = 'Expected to delete one or more pieces'
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const nonExistingId: string = 'nonExistingId'
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ startPartId: partId })
      await testDatabase.populateDatabaseWithPieces([mongoPiece])

      when(mongoConverter.convertPieces(anything())).thenReturn([])
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })
      const action: () => Promise<void> = async () => testee.deletePiecesForPart(nonExistingId)

      await expect(action).rejects.toThrow(DeletionFailedException)
      await expect(action).rejects.toThrow(expectedErrorMessageFragment)
    })

    it('does not deletes any pieces, when nonexistent partId is given', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const nonExistingId: string = 'nonExistingId'
      const partId: string = 'somePartId'
      const mongoPiece: MongoPiece = createMongoPiece({ startPartId: partId })
      await testDatabase.populateDatabaseWithPieces([mongoPiece])
      const db: Db = testDatabase.getDatabase()

      when(mongoConverter.convertPieces(anything())).thenReturn([])
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })
      const action: () => Promise<void> = async () => testee.deletePiecesForPart(nonExistingId)

      await expect(action).rejects.toThrow(DeletionFailedException)
      await expect(db.collection(COLLECTION_NAME).countDocuments()).resolves.toBe(1)
    })
  })

  describe(`${MongoPieceRepository.prototype.getPieces.name}`, () => {
    // TODO: See this test fail.
    it('returns zero pieces when no pieces for given partId exist', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'

      when(mongoConverter.convertPieces(anything())).thenReturn([])
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      const result: Piece[] = await testee.getPieces(partId)

      expect(result.length).toBe(0)
    })

    // TODO: See this test fail.
    it('returns one piece when partId is given', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPieces: MongoPiece[] = [createMongoPiece({startPartId: partId})]
      const pieces: Piece[] = [EntityFactory.createPiece({partId: partId})]
      await testDatabase.populateDatabaseWithPieces(mongoPieces)

      when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      const result: Piece[] = await testee.getPieces(partId)

      // TODO: Fix 'jasmine' not being defined.
      //expect(mongoConverter.convertPieces).toBeCalledWith(arrayContaining(pieces.map((piece) => objectContaining(piece))))
      expect(result.length).toBe(1)
    })

    // TODO: See this test fail.
    it('returns multiple pieces when partId is given', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPieces: MongoPiece[] = [createMongoPiece({startPartId: partId}), createMongoPiece({startPartId: partId})]
      const pieces: Piece[] = [EntityFactory.createPiece({partId: partId}), EntityFactory.createPiece({partId: partId})]
      await testDatabase.populateDatabaseWithPieces(mongoPieces)

      when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      const result: Piece[] = await testee.getPieces(partId)

      // TODO: Fix 'jasmine' not being defined.
      //expect(mongoConverter.convertPieces).toBeCalledWith(arrayContaining(pieces.map((piece) => objectContaining(piece))))
      expect(result.length).toBe(pieces.length)
    })

    // TODO: See this test fail.
    it('converts from mongo pieces to our piece entity, when partId is given', async () => {
      const mongoConverter: MongoEntityConverter = mock(MongoEntityConverter)
      const partId: string = 'somePartId'
      const mongoPieces: MongoPiece[] = [createMongoPiece({startPartId: partId})]
      const pieces: Piece[] = [EntityFactory.createPiece({partId: partId})]
      await testDatabase.populateDatabaseWithPieces(mongoPieces)

      when(mongoConverter.convertPieces(anything())).thenReturn(pieces)
      const testee: PieceRepository = createTestee({
        mongoConverter: mongoConverter,
      })

      await testee.getPieces(partId)

      verify(mongoConverter.convertPieces(anything())).once()
      // TODO: Fix 'jasmine' not being defined.
      //expect(mongoConverter.convertPieces).toBeCalledWith(arrayContaining(pieces.map((piece) => objectContaining(piece))))
    })
  })

  function createMongoPiece(params: Partial<MongoPiece>): MongoPiece {
    return {
      _id: params._id ?? 'id' + Math.random(),
      name: params.name ?? 'name' + Math.random(),
      startPartId: params.startPartId ?? 'partId' + Math.floor(Math.random() * 10),
    } as MongoPiece
  }

  function createTestee(params: {
    mongoDb?: MongoDatabase
    mongoConverter?: MongoEntityConverter
  }): MongoPieceRepository {
    const mongoDb: MongoDatabase = params.mongoDb ?? mock(MongoDatabase)
    const mongoConverter: MongoEntityConverter = params.mongoConverter ?? mock(MongoEntityConverter)

    when(mongoDb.getCollection(COLLECTION_NAME)).thenReturn(testDatabase.getDatabase().collection(COLLECTION_NAME))

    return new MongoPieceRepository(instance(mongoDb), instance(mongoConverter))
  }
})
