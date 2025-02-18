import { BaseMongoRepository } from './base-mongo-repository'
import { Macro } from '../../../model/entities/macro'
import { MongoDatabase } from './mongo-database'
import { NotFoundException } from '../../../model/exceptions/not-found-exception'
import { MongoEntityConverter, MongoMacro } from './mongo-entity-converter'
import { MacroRepository } from '../interfaces/macro-repository'
import { UuidGenerator } from '../interfaces/uuid-generator'

const COLLECTION_NAME: string = 'macros'

export class MongoMacroRepository extends BaseMongoRepository<MongoMacro> implements MacroRepository {

  constructor(private readonly mongoEntityConverter: MongoEntityConverter, mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return COLLECTION_NAME
  }

  public async getMacro(macroId: string): Promise<Macro> {
    this.assertDatabaseConnection(this.getMacro.name)
    const macro: MongoMacro | null = await this.getCollection().findOne<MongoMacro>({_id: macroId})
    if (macro === null) {
      throw new NotFoundException(`No Macro found for MacroId ${macroId}`)
    }
    return this.mongoEntityConverter.convertToMacro(macro)
  }

  public async getMacros(): Promise<Macro[]> {
    this.assertDatabaseConnection(this.getMacros.name)
    return this.getCollection()
      .find<MongoMacro>({})
      .map(mongoMacro => this.mongoEntityConverter.convertToMacro(mongoMacro))
      .toArray()

  }

  public async createMacro(macroWithoutId: Omit<Macro, 'id'>): Promise<Macro> {
    this.assertDatabaseConnection(this.createMacro.name)
    const macro: Macro = {
      ...macroWithoutId,
      id: this.uuidGenerator.generateUuid(),
    }

    await this.getCollection().insertOne({...macro, _id: macro.id})
    return macro
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
