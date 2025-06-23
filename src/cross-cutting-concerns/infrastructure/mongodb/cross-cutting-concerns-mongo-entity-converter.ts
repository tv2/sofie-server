import { MongoId } from '../value-objects/mongo-id'
import { SystemInformation } from '../../domain/value-objects/system-information'

export interface MongoSystemInformation extends MongoId {
  name: string
}

export class CrossCuttingConcernsMongoEntityConverter {
  public convertSystemInformation(mongoSystemInformation: MongoSystemInformation): SystemInformation {
    return {
      name: mongoSystemInformation.name
    }
  }
}
