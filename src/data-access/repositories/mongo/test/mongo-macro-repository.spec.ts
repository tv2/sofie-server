import { MongoMacroRepository } from '../mongo-macro-repository'
import { anyString, anything, capture, instance, mock, when } from '@typestrong/ts-mockito'
import { MongoDatabase } from '../mongo-database'
import { UuidGenerator } from '../../../../cross-cutting-concerns/infrastructure/uuid-generator'
import { Collection } from 'mongodb'
import { MongoId } from '../mongo-entity-converter'
import { EntityTestFactory } from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
import { Macro } from '../../../../rundown-execution/domain/entities/macro'
import { InvalidIdException } from '../../../../rundown-execution/domain/exceptions/invalid-id-exception'

const UUID: string = 'random-uuid'

describe(MongoMacroRepository.name, () => {
  describe(MongoMacroRepository.prototype.createMacro.name, () => {
    let uuidGenerator: UuidGenerator
    let collection: Collection<MongoId>

    beforeEach(() => {
      uuidGenerator = mock<UuidGenerator>()
      when(uuidGenerator.generateUuid()).thenReturn(UUID)

      collection = mock(Collection<MongoId>)
    })


    describe('it receives Macro with no id', () => {
      describe('the id is undefined', () => {
        it('saves the Macro with a new UUID', async () => {
          const macro: Macro = EntityTestFactory.createMacro({ id: undefined })

          const testee: MongoMacroRepository = createTestee({ collection: instance(collection), uuidGenerator: instance(uuidGenerator) })
          await testee.createMacro(macro)

          const [macroArgument] = capture(collection.insertOne).last()
          const result: Macro = macroArgument as unknown as Macro

          expect(result.id).toBe(UUID)
        })
      })

      describe('the id is an empty string', () => {
        it('saves the Macro with a new UUID', async () => {
          const macro: Macro = EntityTestFactory.createMacro({ id: '' })

          const testee: MongoMacroRepository = createTestee({ collection: instance(collection), uuidGenerator: instance(uuidGenerator) })
          await testee.createMacro(macro)

          const [macroArgument] = capture(collection.insertOne).last()
          const result: Macro = macroArgument as unknown as Macro

          expect(result.id).toBe(UUID)
        })
      })
    })

    describe('it receives Macro with pre-existing id', () => {


      describe('the id is not a valid UUID', () => {
        it('throws an InvalidIdException', async () => {
          const nonValidUuid: string = 'non-valid-uuid'
          const macro: Macro = EntityTestFactory.createMacro({ id: nonValidUuid })

          when(uuidGenerator.validateUuid(nonValidUuid)).thenReturn(false)

          const testee: MongoMacroRepository = createTestee({ collection: instance(collection), uuidGenerator: instance(uuidGenerator) })
          const result: () => Promise<Macro> = () => testee.createMacro(macro)

          await expect(result).rejects.toThrow(InvalidIdException)
        })
      })

      describe('the id is a valid UUID', () => {
        beforeEach(() => {
          when(uuidGenerator.validateUuid(anyString())).thenReturn(true)
        })

        it('saves the Macro with the pre-existing id', async () => {
          const preExistingValidUuid: string = 'pre-existing-valid-uuid'
          const macro: Macro = EntityTestFactory.createMacro({ id: preExistingValidUuid })

          const testee: MongoMacroRepository = createTestee({ collection: instance(collection), uuidGenerator: instance(uuidGenerator) })
          await testee.createMacro(macro)

          const [macroArgument] = capture(collection.insertOne).last()
          const result: Macro = macroArgument as unknown as Macro

          expect(result.id).toBe(preExistingValidUuid)
        })

        describe('a Macro already exist with the UUID', () => {
          it('throws an InvalidIdException', async () => {
            const duplicatedId: string = 'duplicatedId'
            const macro: Macro = EntityTestFactory.createMacro({ id: duplicatedId })

            when(collection.countDocuments(anything())).thenReturn(Promise.resolve(1))

            const testee: MongoMacroRepository = createTestee({ collection: instance(collection), uuidGenerator: instance(uuidGenerator) })
            const result: () => Promise<Macro> = () => testee.createMacro(macro)

            await expect(result).rejects.toThrow(InvalidIdException)
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  mongoDatabase?: MongoDatabase,
  collection?: Collection<MongoId>,
  uuidGenerator?: UuidGenerator,
}): MongoMacroRepository {
  return new MongoMacroRepository(
    params?.mongoDatabase ?? getMockDatabase({ collection: params?.collection }),
    params?.uuidGenerator ?? instance(mock<UuidGenerator>())
  )
}

function getMockDatabase(params?: {
  collection?: Collection<MongoId>
}): MongoDatabase {
  const mockDatabase: MongoDatabase = mock(MongoDatabase)
  when(mockDatabase.getCollection(anything())).thenReturn(params?.collection ?? instance(mock(Collection<MongoId>)))
  return instance(mockDatabase)
}
