import { createHash } from 'crypto'

// TODO: Prefix this to Crypto and make an interface. The implementation should be in infrastructure and interface in
// domain.
export class Tv2StringHashConverter {
  public getHashedValue(valueToBeHashed: string): string {
    return createHash('md5').update(valueToBeHashed).digest('hex')
  }
}
