import { UuidGenerator } from './interfaces/uuid-generator'
import * as crypto from 'crypto'

const UUID_REGEX: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class CryptoUuidGenerator implements UuidGenerator {

  public generateUuid(): string {
    return crypto.randomUUID()
  }

  public validateUuid(uuid:string): boolean {
    return UUID_REGEX.test(uuid)
  }
}
