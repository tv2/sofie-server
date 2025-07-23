export interface StringHashGenerator {
  getHashedValue(valueToBeHashed: string): string
}
