import { BaseMongoRepository } from '../../../../cross-cutting-concerns/infrastructure/mongodb/base-mongo-repository'
import { Macro } from '../../../domain/entities/macro'
import { MongoDatabase } from '../../../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { NotFoundException } from '../../../../rundown-execution/domain/exceptions/not-found-exception'
import { MacroRepository } from '../../../domain/repositories/macro-repository'
import { UuidGenerator } from '../../../../cross-cutting-concerns/infrastructure/uuid-generator'
import { MongoId } from '../../../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'
import { InvalidIdException } from '../../../../rundown-execution/domain/exceptions/invalid-id-exception'

const COLLECTION_NAME: string = 'macros'
export class MongoMacroRepository extends BaseMongoRepository<Macro & MongoId> implements MacroRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getMacro(macroId: string): Promise<Macro> {
    this.assertDatabaseConnection(this.getMacro.name)
    const macro: Macro | null = await this.getCollection().findOne<Macro>({_id: macroId})
    if (macro === null) {
      throw new NotFoundException(`No Macro found for MacroId ${macroId}`)
    }
    return macro
  }

  public async getMacros(): Promise<Macro[]> {
    this.assertDatabaseConnection(this.getMacros.name)
    return this.getCollection()
      .find<Macro>({})
      .toArray()

  }

  public async createMacro(macro: Macro): Promise<Macro> {
    this.assertDatabaseConnection(this.createMacro.name)

    if (macro.id && !this.uuidGenerator.validateUuid(macro.id)) {
      throw new InvalidIdException(`"${macro.id}" is not a valid UUID`)
    }

    const macroToBeSaved: Macro = {
      ...macro,
      id: macro.id && macro.id.length > 0 ? macro.id : this.uuidGenerator.generateUuid(),
    }

    const doesMacroWithIdAlreadyExist: boolean = (await this.getCollection().countDocuments({ id: macroToBeSaved.id })) > 0
    if (doesMacroWithIdAlreadyExist) {
      throw new InvalidIdException(`"${macroToBeSaved.id}" already exist`)
    }

    await this.getCollection().insertOne({...macroToBeSaved, _id: macroToBeSaved.id})
    return macroToBeSaved
  }

  public async updateMacro(macro: Macro): Promise<Macro> {
    this.assertDatabaseConnection(this.updateMacro.name)
    if (!await this.doesMacroExist(macro.id)) {
      throw new NotFoundException(`Can't update macro ${macro.id}. It does not exist in the database`)
    }
    await this.getCollection().updateOne({id: macro.id}, {$set: macro})
    return macro
  }

  private async doesMacroExist(macroId: string): Promise<boolean> {
    return (await this.getCollection().countDocuments({ _id: macroId })) === 1
  }

  public async deleteMacro(macroId: string): Promise<void> {
    this.assertDatabaseConnection(this.deleteMacro.name)
    await this.getCollection().deleteOne({ _id: macroId })
  }
}
