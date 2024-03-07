import { BaseMongoRepository } from './base-mongo-repository'
import { MongoDatabase } from './mongo-database'
import { ShelfConfigurationRepository } from '../interfaces/shelf-configuration-repository'
import { ShelfConfiguration } from '../../../model/entities/shelf-configuration'
import { UuidGenerator } from '../interfaces/uuid-generator'

const SHELF_CONFIGURATION_COLLECTION_NAME: string = 'shelfConfiguration'
const SHELF_CONFIGURATION_ID: string = 'SHELF_CONFIGURATION_ID' // The system only support having a single Shelf.

export class MongoShelfRepository extends BaseMongoRepository implements ShelfConfigurationRepository {

  constructor(mongoDatabase: MongoDatabase, private readonly uuidGenerator: UuidGenerator
  ) {
    super(mongoDatabase)
  }

  protected getCollectionName(): string {
    return SHELF_CONFIGURATION_COLLECTION_NAME
  }

  public async getShelfConfiguration(): Promise<ShelfConfiguration> {
    this.assertDatabaseConnection(this.getShelfConfiguration.name)
    const shelfConfiguration: ShelfConfiguration | null = await this.getCollection().findOne<ShelfConfiguration>()
    if (!shelfConfiguration) {
      // There should always be exactly one Shelf in the database. If there is none (new installation) we create one.
      return this.createEmptyShelfConfiguration()
    }
    return shelfConfiguration
  }

  private async createEmptyShelfConfiguration(): Promise<ShelfConfiguration> {
    const shelfConfiguration: ShelfConfiguration = {
      id: SHELF_CONFIGURATION_ID,
      actionPanelConfigurations: []
    }
    await this.getCollection().insertOne({...shelfConfiguration, _id: shelfConfiguration.id })
    return shelfConfiguration
  }

  public async updateShelfConfiguration(shelfConfiguration: ShelfConfiguration): Promise<ShelfConfiguration> {
    this.assertDatabaseConnection(this.updateShelfConfiguration.name)
    shelfConfiguration = this.applyMissingActionPanelIds(shelfConfiguration)
    await this.getCollection().updateOne({ id: shelfConfiguration.id }, { $set: shelfConfiguration })
    return shelfConfiguration
  }

  private applyMissingActionPanelIds(shelfConfiguration: ShelfConfiguration): ShelfConfiguration {
    shelfConfiguration.actionPanelConfigurations = shelfConfiguration.actionPanelConfigurations.map(actionPanel => {
      if (!actionPanel.id || actionPanel.id.length <= 0) {
        actionPanel.id = this.uuidGenerator.generateUuid()
      }
      return actionPanel
    })
    return shelfConfiguration
  }
}
