import { createHash } from 'crypto'

export class Tv2StringHashConverter {
  public getHashedValue(valueToBeHashed: string ): string {
    return createHash('md5').update(valueToBeHashed).digest('hex')
  }
}