import { UuidGenerator } from './interfaces/uuid-generator'
import * as crypto from 'crypto'

export class CryptoUuidGenerator implements UuidGenerator {

  public generateUuid(): string {
    return crypto.randomUUID()
  }
}
