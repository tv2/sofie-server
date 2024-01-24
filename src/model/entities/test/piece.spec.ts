import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'
import { UNSYNCED_ID_POSTFIX } from '../../value-objects/unsynced_constants'

describe(Piece.name, () => {
  describe(Piece.prototype.setExecutedAt.name, () => {
    it('updates executedAt', () => {
      const testee: Piece = new Piece({
        pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
      } as PieceInterface)

      const now: number = Date.now()
      testee.setExecutedAt(now)

      const result: number = testee.getExecutedAt()
      expect(result).toEqual(now)
    })
  })

  describe(Piece.prototype.resetExecutedAt.name, () => {
    it('sets executedAt to zero', () => {
      const testee: Piece = new Piece({} as PieceInterface)

      testee.setExecutedAt(Date.now())
      testee.resetExecutedAt()

      const result: number = testee.getExecutedAt()
      expect(result).toEqual(0)
    })
  })

  describe(Piece.prototype.setPartId.name, () => {
    describe('Piece is planned', () => {
      it('throws an error', () => {
        const testee: Piece = new Piece({ isPlanned: true } as PieceInterface)
        expect(() => testee.setPartId('somePartId')).toThrow()
      })
    })

    describe('Piece is unplanned', () => {
      it('updates the Part id', () => {
        const partId: string = 'partId'
        const testee: Piece = new Piece({partId: '', isPlanned: false } as PieceInterface)

        expect(testee.getPartId()).not.toBe(partId)
        testee.setPartId(partId)
        expect(testee.getPartId()).toBe(partId)
      })
    })
  })

  describe(Piece.prototype.setStart.name, () => {
    describe('Piece is planned', () => {
      it('throws an error', () => {
        const testee: Piece = new Piece({ isPlanned: true } as PieceInterface)
        expect(() => testee.setStart(10)).toThrow()
      })
    })

    describe('Piece is unplanned', () => {
      it('updates the start time', () => {
        const startTime: number = 100
        const testee: Piece = new Piece({ start: 0, isPlanned: false } as PieceInterface)

        expect(testee.getStart()).not.toBe(startTime)
        testee.setStart(startTime)
        expect(testee.getStart()).toBe(startTime)
      })
    })
  })

  describe(Piece.prototype.markAsUnsynced.name, () => {
    it('marks the Piece as unsynced', () => {
      const testee: Piece = new Piece({ isUnsynced: false, partId: 'somePartId' } as PieceInterface)
      expect(testee.isUnsynced()).toBeFalsy()
      testee.markAsUnsynced()
      expect(testee.isUnsynced()).toBeTruthy()
    })

    describe('Part id is already postfix as unsynced', () => {
      it('does not postfix the Part id again', () => {
        const partIdWithPostfix: string = `somePartId${UNSYNCED_ID_POSTFIX}`
        const testee: Piece = new Piece({ partId: partIdWithPostfix } as PieceInterface)
        testee.markAsUnsynced()
        expect(testee.getPartId()).toBe(`${partIdWithPostfix}`)
      })
    })
  })

  describe(Piece.prototype.markAsUnsyncedWithUnsyncedPart.name, () => {
    it('postfix the Part id as unsynced', () => {
      const partIdWithoutPostfix: string = 'somePartId'
      const testee: Piece = new Piece({ partId: partIdWithoutPostfix } as PieceInterface)
      testee.markAsUnsyncedWithUnsyncedPart()
      expect(testee.getPartId()).toBe(`${partIdWithoutPostfix}${UNSYNCED_ID_POSTFIX}`)
    })
  })
})
