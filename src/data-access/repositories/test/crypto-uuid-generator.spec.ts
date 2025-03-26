import { CryptoUuidGenerator } from '../crypto-uuid-generator'

describe(CryptoUuidGenerator.name, () => {
  describe(CryptoUuidGenerator.prototype.validateUuid.name, () => {
    describe('it receives invalid UUID', () => {
      it('returns false', () => {
        const invalidUuid: string = 'invalid-uuid'
        const testee: CryptoUuidGenerator = new CryptoUuidGenerator()
        const result: boolean = testee.validateUuid(invalidUuid)
        expect(result).toBeFalsy()
      })
    })

    describe('receives valid UUID', () => {
      it('returns true', () => {
        const validUuids: string[] = [
          '561b416f-8ff5-4868-8c6a-bb81f1f9819e',
          '085bfa30-f701-48dd-a91b-f4fd2e945828',
          '8b647d8a-8e44-432e-98e8-d2696cbc13d8',
          '644bc4e9-e27e-49b5-9ad4-5470b1d9e359',
          '43ced391-d2e8-4a49-8f71-45e9dadae515',
          'cf005492-08f1-4fe2-b13f-0d1239eb09cd',
          'fbb514c3-cc50-4885-854a-485dee478f93',
          'be768b9a-549a-4fde-aa65-381955527c5c',
          'fe865237-55a6-42c5-a023-0a0fa800339c',
          'e32bb38a-f4e6-4a08-b019-fe2e6012e0f0',
        ]

        const testee: CryptoUuidGenerator = new CryptoUuidGenerator()
        const result: boolean = validUuids.every(testee.validateUuid)
        expect(result).toBeTruthy()
      })
    })
  })
})
