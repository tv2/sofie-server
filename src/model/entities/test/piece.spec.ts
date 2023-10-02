import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'

describe(Piece.name, () => {
  describe(`${Piece.prototype.setExecutedAt.name}`, () => {
    describe('piece is not an infinite Piece', () => {
      it('does not set executedAt', () => {
        const testee: Piece = new Piece({
          pieceLifespan: PieceLifespan.WITHIN_PART,
        } as PieceInterface)
        const executedAtBefore: number = testee.getExecutedAt()

        testee.setExecutedAt(Date.now())

        const executedAtAfter: number = testee.getExecutedAt()
        expect(executedAtAfter).toEqual(executedAtBefore)
      })
    })

    describe('piece is an infinite Piece', () => {
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
  })

  describe(`${Piece.prototype.resetExecutedAt.name}`, () => {
    it('sets executedAt to zero', () => {
      const testee: Piece = new Piece({} as PieceInterface)

      testee.setExecutedAt(Date.now())
      testee.resetExecutedAt()

      const result: number = testee.getExecutedAt()
      expect(result).toEqual(0)
    })
  })

  describe(`${Piece.prototype.setPartId.name}`, () => {
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

  describe(`${Piece.prototype.setStart.name}`, () => {
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
})
