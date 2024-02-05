import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { ShelfRepository } from '../interfaces/shelf-repository'
import { Shelf } from '../../../model/entities/shelf'

const SHELF_COLLECTION_NAME: string = 'shelf'
const SHELF_ID: string = 'SHELF_ID' // The system only support having a single Shelf.

export class MongoShelfRepository extends BaseMongoRepository implements ShelfRepository {

  constructor(mongoDatabase: MongoDatabase,
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return SHELF_COLLECTION_NAME
  }

  public async getShelf(): Promise<Shelf> {
    this.assertDatabaseConnection(this.getShelf.name)
    const shelf: Shelf | null = await this.getCollection().findOne<Shelf>()
    if (!shelf) {
      // There should always be exactly one Shelf in the database. If there is none (new installation) we create one.
      return this.createEmptyShelf()
    }
    return shelf
  }

  private async createEmptyShelf(): Promise<Shelf> {
    const newShelf: Shelf = {
      id: SHELF_ID,
      actionPanels: []
    }
    await this.getCollection().insertOne({...newShelf, _id: newShelf.id })
    return newShelf
  }

  public async updateShelf(shelf: Shelf): Promise<Shelf> {
    this.assertDatabaseConnection(this.updateShelf.name)
    await this.getCollection().updateOne({ id: shelf.id }, { $set: shelf })
    return shelf
  }
}
