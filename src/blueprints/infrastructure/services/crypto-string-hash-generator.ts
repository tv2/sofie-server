import { createHash } from 'crypto'

export class CryptoStringHashGenerator {
  public getHashedValue(valueToBeHashed: string): string {
    return createHash('md5').update(valueToBeHashed).digest('hex')
  }
}
