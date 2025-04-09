import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece, PieceInterface } from '../piece'
import { UNSYNCED_ID_POSTFIX } from '../../value-objects/unsynced_constants'
import { EntityTestFactory } from './entity-test-factory'
import { IngestedPiece } from '../ingested-piece'
import { TimelineObject } from '../timeline-object'

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

  describe(Piece.prototype.resetFromIngestedPiece.name, () => {
    it('sets Piece.start to the same as the IngestedPiece', () => {
      const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ start: 4321 })

      const testee: Piece = new Piece({ start: 1234 } as PieceInterface)

      expect(testee.getStart()).not.toBe(ingestedPiece.start)
      testee.resetFromIngestedPiece(ingestedPiece)
      expect(testee.getStart()).toBe(ingestedPiece.start)
    })

    it('sets Piece.duration to the same as the IngestedPiece', () => {
      const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ duration: 4321 })

      const testee: Piece = new Piece({ duration: 1234 } as PieceInterface)

      expect(testee.getDuration()).not.toBe(ingestedPiece.duration)
      testee.resetFromIngestedPiece(ingestedPiece)
      expect(testee.getDuration()).toBe(ingestedPiece.duration)
    })

    it('sets Piece.timelineObjects to the same as the IngestedPiece', () => {
      const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ timelineObjects: [
        { id: 'object1' } as TimelineObject,
        { id: 'object2' } as TimelineObject,
      ] })

      const testee: Piece = new Piece({ timelineObjects: [
        { id: 'object3' } as TimelineObject,
        { id: 'object4' } as TimelineObject,
        { id: 'object5' } as TimelineObject,
      ] } as PieceInterface)

      expect(testee.getTimelineObjects()).not.toStrictEqual(ingestedPiece.timelineObjects)
      testee.resetFromIngestedPiece(ingestedPiece)
      expect(testee.getTimelineObjects()).toStrictEqual(ingestedPiece.timelineObjects)
    })

    describe('the Piece is infinite Piece', () => {
      it('it does not reset Piece.executedAt', () => {
        const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({})
        const executedAt: number = Date.now()

        const testee: Piece = new Piece({ executedAt, pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE } as PieceInterface)

        expect(testee.getExecutedAt()).not.toBe(0)
        testee.resetFromIngestedPiece(ingestedPiece)
        expect(testee.getExecutedAt()).toBe(executedAt)
      })
    })

    describe('the Piece is not an infinite Piece', () => {
      it('sets Piece.executedAt to zero', () => {
        const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ })
        const executedAt: number = Date.now()

        const testee: Piece = new Piece({ executedAt, pieceLifespan: PieceLifespan.WITHIN_PART } as PieceInterface)

        expect(testee.getExecutedAt()).not.toBe(0)
        testee.resetFromIngestedPiece(ingestedPiece)
        expect(testee.getExecutedAt()).toBe(0)
      })
    })
  })

  describe(Piece.prototype.hasEnded.name, () => {
    describe('it does not have an executedAt', () => {
      it('has not ended', () => {
        const testee: Piece = EntityTestFactory.createPiece({ executedAt: undefined })
        expect(testee.hasEnded(Date.now())).toBeFalsy()
      })
    })

    describe('executedAt is zero', () => {
      describe('it does not have a duration', () => {
        it('has not ended', () => {
          const testee: Piece = EntityTestFactory.createPiece({ executedAt: 0, duration: undefined })
          expect(testee.hasEnded(Date.now())).toBeFalsy()
        })
      })

      describe('it has a duration which is less than now - executedAt ', () => {
        it('has ended', () => {
          const testee: Piece = EntityTestFactory.createPiece({ executedAt: 12345678, duration: 10 })
          expect(testee.hasEnded(Date.now())).toBeTruthy()
        })
      })
    })


    describe('executedAt is more than zero', () => {
      const now: number = 500

      describe('it does not have a duration', () => {
        it('has not ended', () => {
          const testee: Piece = EntityTestFactory.createPiece({ executedAt: 10, duration: undefined })
          expect(testee.hasEnded(now)).toBeFalsy()
        })
      })

      describe('the Piece has a duration', () => {
        describe('executedAt + duration is less than now', () => {
          it('has ended', () => {
            const testee: Piece = EntityTestFactory.createPiece({ executedAt: 100, duration: 100 })
            expect(testee.hasEnded(now)).toBeTruthy()
          })
        })

        describe('executedAt + duration is equal to now', () => {
          it('has ended', () => {
            const testee: Piece = EntityTestFactory.createPiece({ executedAt: 250, duration: 250 })
            expect(testee.hasEnded(now)).toBeTruthy()
          })
        })

        describe('executedAt + duration is exactly one less than now', () => {
          it('has ended', () => {
            const testee: Piece = EntityTestFactory.createPiece({ executedAt: 250, duration: 249 })
            expect(testee.hasEnded(now)).toBeTruthy()
          })
        })

        describe('executedAt + duration is exactly one larger than now', () => {
          it('has not ended', () => {
            const testee: Piece = EntityTestFactory.createPiece({ executedAt: 250, duration: 251 })
            expect(testee.hasEnded(now)).toBeFalsy()
          })
        })

        describe('executedAt + duration is larger than now', () => {
          it('has not ended', () => {
            const testee: Piece = EntityTestFactory.createPiece({ executedAt: 300, duration: 300 })
            expect(testee.hasEnded(now)).toBeFalsy()
          })
        })
      })
    })
  })

  describe(Piece.prototype.stop.name, () => {
    describe('Piece isn\'t stopped', () => {
      it('sets duration to now() minus executedAt', () => {
        const now: number = 300
        jest.useFakeTimers({ now })
        const testee: Piece = new Piece({ executedAt: 10, duration: undefined } as PieceInterface)

        testee.stop()
        expect(testee.getDuration()).toBe(now - testee.getExecutedAt())
      })
    })

    describe('Piece already have a duration', () => {
      describe('the duration plus executedAt is in the future', () => {
        it('sets duration to now() minus executedAt', () => {
          const now: number = 300
          jest.useFakeTimers({ now })

          const testee: Piece = new Piece({ executedAt: 10, duration: 400 } as PieceInterface)
          testee.stop()

          expect(testee.getDuration()).toBe(now - testee.getExecutedAt())
        })
      })

      describe('the duration plus executedAt is in the past', () => {
        it('does not update duration', () => {
          const now: number = 300
          jest.useFakeTimers({ now })

          const duration: number = 20
          const testee: Piece = new Piece({ executedAt: 15, duration } as PieceInterface)

          expect(testee.getDuration()).toBe(duration)
          testee.stop()
          expect(testee.getDuration()).toBe(duration)
        })
      })
    })
  })

  describe(Piece.prototype.copy.name, () => {
    it('gets "_COPY" post-fixed to its id', () => {
      const copyPostFix: string = '_COPY'
      const testee: Piece = EntityTestFactory.createPiece({ id: 'somePieceId' })
      expect(testee.id).not.toContain(copyPostFix)

      const result: Piece = testee.copy()
      expect(result.id).toContain(copyPostFix)
    })

    describe('new PartId is provided', () => {
      it('uses the new PartId', () => {
        const testee: Piece = EntityTestFactory.createPiece({ partId: 'randomPartId' })
        const newPartId: string = 'newPartId'
        const result: Piece = testee.copy(newPartId)
        expect(result.getPartId()).toBe(newPartId)
      })
    })

    describe('no new PartId is provided', () => {
      it('uses the original Part id in the copy', () => {
        const testee: Piece = EntityTestFactory.createPiece({ partId: 'randomPartId' })
        const result: Piece = testee.copy()
        expect(result.getPartId()).toBe(testee.getPartId())
      })
    })

    describe('the Piece is planned', () => {
      it('returns a non-planned copy', () => {
        const testee: Piece = EntityTestFactory.createPiece({ isPlanned: true })
        const result: Piece = testee.copy()
        expect(result.isPlanned).toBeFalsy()
      })
    })

    describe('the Piece is not planned', () => {
      it('returns a non-planned copy', () => {
        const testee: Piece = EntityTestFactory.createPiece({ isPlanned: false })
        const result: Piece = testee.copy()
        expect(result.isPlanned).toBeFalsy()
      })
    })

    describe('it has had TimelineObjects inserted', () => {
      it('clears the inserted TimelineObjects in the copy', () => {
        const testee: Piece = EntityTestFactory.createPiece()
        testee.insertTimelineObjects([EntityTestFactory.createTimelineObject({ id: 'timelineObjectOne' }), EntityTestFactory.createTimelineObject({ id: 'timelineObjectTwo' })])

        expect(testee.getTimelineObjects()).toHaveLength(2)
        const result: Piece = testee.copy()
        expect(result.getTimelineObjects()).toHaveLength(0)
      })

      it('keeps the original TimelineObjects in the copy', () => {
        const testee: Piece = EntityTestFactory.createPiece({ timelineObjects: [EntityTestFactory.createTimelineObject({ id: 'timelineObjectOne' }), EntityTestFactory.createTimelineObject({ id: 'timelineObjectTwo' })] })
        expect(testee.getTimelineObjects()).toHaveLength(2)
        const result: Piece = testee.copy()
        expect(result.getTimelineObjects()).toHaveLength(2)
      })
    })
  })

  describe(Piece.prototype.getTimelineObjects.name, () => {
    it('returns TimelineObjects from both the original and inserted array', () => {
      const testee: Piece = EntityTestFactory.createPiece({ timelineObjects: [EntityTestFactory.createTimelineObject({ id: 'originalTimelineObject' })] })
      testee.insertTimelineObjects([EntityTestFactory.createTimelineObject({ id: 'insertedTimelineObject' })])
      expect(testee.getTimelineObjects()).toHaveLength(2)
    })
  })
})
