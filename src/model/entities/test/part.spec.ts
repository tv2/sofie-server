import { Part, PartInterface } from '../part'
import { EntityMockFactory } from './entity-mock-factory'
import { PartTimings } from '../../value-objects/part-timings'
import { Piece, PieceInterface } from '../piece'
import { UNSYNCED_ID_POSTFIX } from '../../value-objects/unsynced_constants'
import { instance, verify } from '@typestrong/ts-mockito'
import { EntityTestFactory } from './entity-test-factory'
import { UnsupportedOperationException } from '../../exceptions/unsupported-operation-exception'
import { IngestedPiece } from '../ingested-piece'
import { IngestedPart } from '../ingested-part'
import { Invalidity } from '../../value-objects/invalidity'
import { InvalidPartException } from '../../exceptions/invalid-part-exception'

describe(Part.name, () => {
  describe(Part.prototype.getTimings.name, () => {
    it('has not had its timings calculated yet - throws error', () => {
      const testee: Part = new Part({} as PartInterface)
      expect(() => testee.getTimings()).toThrow()
    })

    it('has had its timings calculated - returns timings', () => {
      const testee: Part = new Part({} as PartInterface)
      testee.calculateTimings()
      const result: PartTimings = testee.getTimings()
      expect(result).not.toBeUndefined()
    })
  })

  describe(Part.prototype.putOnAir.name, () => {
    afterEach(() => jest.useRealTimers())

    it('sets part to be on air', () => {
      const testee: Part = new Part({ isOnAir: false } as PartInterface)

      expect(testee.isOnAir()).toBe(false)
      testee.putOnAir()

      const result: boolean = testee.isOnAir()
      expect(result).toBe(true)
    })

    it('sets when it was executed to now', () => {
      const testee: Part = new Part({} as PartInterface)
      const now: number = 123456789

      jest.useFakeTimers({ now })
      testee.putOnAir()

      const result: number = testee.getExecutedAt()
      expect(result).toBe(now)
    })

    describe('when part is invalid', () => {
      it('throws an invalid part exception', () => {
        const invalidity: Invalidity = { reason: 'Some reason' }
        const testee: Part = EntityTestFactory.createPart({ invalidity })

        const result: () => void = () => testee.putOnAir()

        expect(result).toThrow(InvalidPartException)
      })
    })
  })

  describe(Part.prototype.takeOffAir.name, () => {
    afterEach(() => jest.useRealTimers())

    it('sets part to be off air', () => {
      const testee: Part = new Part({ isOnAir: true } as PartInterface)

      testee.takeOffAir()

      const result: boolean = testee.isOnAir()
      expect(result).toBe(false)
    })

    it('sets played duration', () => {
      const executedAt: number = 123450000
      const testee: Part = new Part({ isOnAir: true, executedAt } as PartInterface)
      const duration: number = 6789
      const now: number = executedAt + duration

      jest.useFakeTimers({ now })
      testee.takeOffAir()

      const result: number = testee.getPlayedDuration()
      expect(result).toBe(duration)
    })
  })

  describe(Part.prototype.reset.name, () => {
    it('has an executedAt value of 0 after being reset', () => {
      const testee: Part = new Part({ executedAt: 123456789, ingestedPart: {} } as PartInterface)

      testee.reset()

      const result: number = testee.getExecutedAt()
      expect(result).toBe(0)
    })

    it('has a playedDuration value of 0 after being reset', () => {
      const testee: Part = new Part({ playedDuration: 5023, ingestedPart: {} } as PartInterface)

      testee.reset()

      const result: number = testee.getPlayedDuration()
      expect(result).toBe(0)
    })

    it('removes all unplanned Pieces from its Pieces array', () => {
      const plannedPieceOne: Piece = EntityMockFactory.createPiece({ id: 'plannedOne', isPlanned: true })
      const plannedPieceTwo: Piece = EntityMockFactory.createPiece({ id: 'plannedTwo', isPlanned: true })
      const unPlannedPieceOne: Piece = EntityMockFactory.createPiece({ id: 'unPlannedOne', isPlanned: false })
      const unPlannedPieceTwo: Piece = EntityMockFactory.createPiece({ id: 'unPlannedTwo', isPlanned: false })

      const testee: Part = new Part({ pieces: [
        plannedPieceOne, plannedPieceTwo, unPlannedPieceOne, unPlannedPieceTwo
      ], ingestedPart: {
        ingestedPieces: [
          createShallowIngestedPiece(plannedPieceOne.id),
          createShallowIngestedPiece(plannedPieceTwo.id)
        ] as Readonly<IngestedPiece[]>
      } as IngestedPart } as PartInterface)

      expect(testee.getPieces()).toContain(unPlannedPieceOne)
      expect(testee.getPieces()).toContain(unPlannedPieceTwo)

      testee.reset()

      expect(testee.getPieces()).toContain(plannedPieceOne)
      expect(testee.getPieces()).toContain(plannedPieceTwo)
      expect(testee.getPieces()).not.toContain(unPlannedPieceOne)
      expect(testee.getPieces()).not.toContain(unPlannedPieceTwo)
    })
  })

  describe(Part.prototype.setSegmentId.name, () => {
    describe('Part is planned', () => {
      it('throws an error', () => {
        const testee: Part = new Part({ ingestedPart: {} } as PartInterface)
        expect(() => testee.setSegmentId('someSegmentId')).toThrow()
      })
    })

    describe('Part is unplanned', () => {
      it('updates the Segment id', () => {
        const segmentId: string = 'segmentId'
        const testee: Part = new Part({ segmentId: '', ingestedPart: undefined } as PartInterface)

        expect(testee.getSegmentId()).not.toBe(segmentId)
        testee.setSegmentId(segmentId)
        expect(testee.getSegmentId()).toBe(segmentId)
      })
    })
  })

  describe(Part.prototype.insertPiece.name, () => {
    describe('Piece is a planned Piece', () => {
      it('throws an error', () => {
        const plannedPiece: Piece = EntityMockFactory.createPiece({ isPlanned: true })
        const testee: Part = new Part({ } as PartInterface)

        expect(() => testee.insertPiece(plannedPiece)).toThrow()
      })
    })

    describe('Piece is an unplanned Piece', () => {
      it('updates the Part id of the Piece to the id of the Part', () => {
        const unplannedPiece: Piece = new Piece({ partId: '', isPlanned: false } as PieceInterface)
        const testee: Part = new Part({ id: 'partId' } as PartInterface)

        testee.insertPiece(unplannedPiece)
        expect(unplannedPiece.getPartId()).toBe(testee.id)
      })

      it('adds the Piece to the array of Pieces for the Part', () => {
        const unplannedPiece: Piece = new Piece({ partId: '', isPlanned: false } as PieceInterface)
        const testee: Part = new Part({ id: 'partId' } as PartInterface)

        expect(testee.getPieces()).not.toContain(unplannedPiece)
        testee.insertPiece(unplannedPiece)
        expect(testee.getPieces()).toContain(unplannedPiece)
      })

      describe('there is already a Piece on the layer of the inserted Piece', () => {
        it('does not remove the existing Piece from the Part', () => {
          const layer: string = 'someLayer'
          const unplannedPiece: Piece = EntityTestFactory.createPiece({ id: 'unplannedPiece', partId: '', isPlanned: false, layer })
          const existingPiece: Piece = EntityTestFactory.createPiece({ id: 'existingPiece', isPlanned: true, layer })

          const testee: Part = new Part({ id: 'partId', pieces: [existingPiece] } as PartInterface)

          expect(testee.getPieces()).toContain(existingPiece)
          expect(testee.getPieces()).not.toContain(unplannedPiece)

          testee.insertPiece(unplannedPiece)

          expect(testee.getPieces()).toContain(existingPiece)
          expect(testee.getPieces()).toContain(unplannedPiece)
        })
      })

      describe('the Part is On Air', () => {
        it('sets the start of the Piece to the amount of time since the Part was started', () => {
          const now: number = 1000
          jest.useFakeTimers({ now })
          const partStartedAt: number = 20
          const timeSincePartStartAndPieceInserted: number = now - partStartedAt

          const unplannedPiece: Piece = new Piece({ partId: '', isPlanned: false } as PieceInterface)
          const testee: Part = new Part({ id: 'partId', isOnAir: true, executedAt: partStartedAt } as PartInterface)

          testee.insertPiece(unplannedPiece)
          expect(unplannedPiece.getStart()).toBe(timeSincePartStartAndPieceInserted)
        })
      })
    })
  })

  describe(Part.prototype.replacePiece.name, () => {
    describe('Piece to replace is not a Piece on the Part', () => {
      it('throws an unsupported operation exception', () => {
        const pieceToBeReplaced: Piece = EntityTestFactory.createPiece({ id: 'toBeReplacedPiece', isPlanned: false })
        const newPiece: Piece = EntityTestFactory.createPiece({ id: 'newPiece' })

        const testee: Part = new Part({ } as PartInterface)

        expect(() => testee.replacePiece(pieceToBeReplaced, newPiece)).toThrow(UnsupportedOperationException)
      })
    })

    it('removes the Piece to replace from the Part', () => {
      const pieceToBeReplaced: Piece = EntityTestFactory.createPiece({ id: 'toBeReplacedPiece', isPlanned: false })
      const newPiece: Piece = EntityTestFactory.createPiece({ id: 'newPiece' })

      const testee: Part = new Part({ pieces: [pieceToBeReplaced] } as PartInterface)

      expect(testee.getPieces()).toContain(pieceToBeReplaced)

      testee.replacePiece(pieceToBeReplaced, newPiece)

      expect(testee.getPieces()).not.toContain(pieceToBeReplaced)
    })

    it('inserts the new Piece on the Part', () => {
      const pieceToBeReplaced: Piece = EntityTestFactory.createPiece({ id: 'toBeReplacedPiece', isPlanned: false })
      const newPiece: Piece = EntityTestFactory.createPiece({ id: 'newPiece' })

      const testee: Part = new Part({ pieces: [pieceToBeReplaced] } as PartInterface)

      expect(testee.getPieces()).not.toContain(newPiece)

      testee.replacePiece(pieceToBeReplaced, newPiece)

      expect(testee.getPieces()).toContain(newPiece)
    })

    it('gives the new Piece the same index in the Pieces of the Part as the Piece to replace', () => {
      const pieceToBeReplaced: Piece = EntityTestFactory.createPiece({ id: 'toBeReplacedPiece', isPlanned: false })
      const newPiece: Piece = EntityTestFactory.createPiece({ id: 'newPiece' })

      const testee: Part = new Part({ pieces: [pieceToBeReplaced] } as PartInterface)

      const indexOfPieceToBeReplaced: number = testee.getPieces().findIndex(piece => piece.id === pieceToBeReplaced.id)
      expect(indexOfPieceToBeReplaced).not.toBe(-1)

      testee.replacePiece(pieceToBeReplaced, newPiece)

      const indexOfNewPiece: number = testee.getPieces().findIndex(piece => piece.id === newPiece.id)
      expect(indexOfPieceToBeReplaced).toBe(indexOfNewPiece)
    })
  })

  describe(Part.prototype.calculateTimings.name, () => {
    describe('there is no previous Part', () => {
      it('has no inTransitionStart', () => {
        const testee: Part = new Part({} as PartInterface)

        testee.calculateTimings()

        const result: PartTimings = testee.getTimings()
        expect(result.inTransitionStart).toBeUndefined()
      })

      describe('it have no Pieces', () => {
        it('returns zero for delayStartOfPiecesDuration', () => {
          const testee: Part = new Part({} as PartInterface)

          testee.calculateTimings()

          const result: PartTimings = testee.getTimings()
          expect(result.delayStartOfPiecesDuration).toBe(0)
        })

        it('returns zero for postRollDuration', () => {
          const testee: Part = new Part({} as PartInterface)

          testee.calculateTimings()

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(0)
        })
      })

      describe('it has Pieces', () => {
        describe('has only pieces with no PreRoll', () => {
          it('returns zero for delayStartOfPiecesDuration', () => {
            const piece: Piece = EntityMockFactory.createPiece()
            const testee: Part = new Part({ pieces: [piece] } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.delayStartOfPiecesDuration).toBe(0)
          })

          it('returns zero for previousPartContinueIntoPartDuration', () => {
            const piece: Piece = EntityMockFactory.createPiece()
            const testee: Part = new Part({ pieces: [piece] } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.previousPartContinueIntoPartDuration).toBe(0)
          })
        })

        describe('has piece with PreRoll', () => {
          it('returns piece.preRoll for delayStartOfPiecesDuration', () => {
            const piece: Piece = EntityMockFactory.createPiece({ preRollDuration: 15 })
            const testee: Part = new Part({ pieces: [piece] } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.delayStartOfPiecesDuration).toBe(piece.preRollDuration)
          })

          it('returns piece.preRoll for previousPartContinueIntoPartDuration', () => {
            const piece: Piece = EntityMockFactory.createPiece({ preRollDuration: 15 })
            const testee: Part = new Part({ pieces: [piece] } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.previousPartContinueIntoPartDuration).toBe(piece.preRollDuration)
          })
        })

        describe('has two pieces with PreRoll', () => {
          it('returns highest PreRoll for delayStartOfPiecesDuration', () => {
            const pieceWithLowestPreRoll: Piece = EntityMockFactory.createPiece({
              preRollDuration: 15,
            })
            const pieceWithHighestPreRoll: Piece = EntityMockFactory.createPiece({
              preRollDuration: 25,
            })
            const testee: Part = new Part({
              pieces: [pieceWithLowestPreRoll, pieceWithHighestPreRoll],
            } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.delayStartOfPiecesDuration).toBe(pieceWithHighestPreRoll.preRollDuration)
          })

          it('returns highest PreRoll for previousPartContinueIntoPartDuration', () => {
            const pieceWithLowestPreRoll: Piece = EntityMockFactory.createPiece({
              preRollDuration: 15,
            })
            const pieceWithHighestPreRoll: Piece = EntityMockFactory.createPiece({
              preRollDuration: 25,
            })
            const testee: Part = new Part({
              pieces: [pieceWithLowestPreRoll, pieceWithHighestPreRoll],
            } as PartInterface)

            testee.calculateTimings()

            const result: PartTimings = testee.getTimings()
            expect(result.previousPartContinueIntoPartDuration).toBe(
              pieceWithHighestPreRoll.preRollDuration
            )
          })
        })

        it('has one Piece with PostRoll - return PostRoll of Piece', () => {
          const piece: Piece = EntityMockFactory.createPiece({ postRollDuration: 10 })
          const testee: Part = new Part({ pieces: [piece] } as PartInterface)

          testee.calculateTimings()

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(piece.postRollDuration)
        })

        it('has one Piece with PostRoll and a duration - return zero for PostRoll', () => {
          const piece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 10,
            duration: 20,
          })
          const testee: Part = new Part({ pieces: [piece] } as PartInterface)

          testee.calculateTimings()

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(0)
        })

        it('has two Pieces Pieces with PostRoll - return highest PostRoll', () => {
          const lowestPostRollPiece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 10,
          })
          const highestPostRollPiece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 20,
          })
          const testee: Part = new Part({
            pieces: [lowestPostRollPiece, highestPostRollPiece],
          } as PartInterface)

          testee.calculateTimings()

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(highestPostRollPiece.postRollDuration)
        })
      })
    })

    describe('there is a previous Part', () => {
      describe('the Part has no pieces', () => {
        it('returns zero for delayStartOfPiecesDuration', () => {
          const previousPart: Part = EntityMockFactory.createPart({} as PartInterface)

          const testee: Part = new Part({} as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.delayStartOfPiecesDuration).toBe(0)
        })

        it('returns zero for postRollDuration', () => {
          const previousPart: Part = EntityMockFactory.createPart({} as PartInterface)

          const testee: Part = new Part({} as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(0)
        })
      })

      describe('it has pieces', () => {
        it('has one Piece with PostRoll - return PostRoll of Piece', () => {
          const previousPart: Part = EntityMockFactory.createPart({} as PartInterface)

          const piece: Piece = EntityMockFactory.createPiece({ postRollDuration: 10 })
          const testee: Part = new Part({ pieces: [piece] } as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(piece.postRollDuration)
        })

        it('has one Piece with PostRoll and a duration - return zero for PostRoll', () => {
          const previousPart: Part = EntityMockFactory.createPart({} as PartInterface)

          const piece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 10,
            duration: 20,
          })
          const testee: Part = new Part({ pieces: [piece] } as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(0)
        })

        it('has two Pieces Pieces with PostRoll - return highest PostRoll', () => {
          const previousPart: Part = EntityMockFactory.createPart({} as PartInterface)

          const lowestPostRollPiece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 10,
          })
          const highestPostRollPiece: Piece = EntityMockFactory.createPiece({
            postRollDuration: 20,
          })
          const testee: Part = new Part({
            pieces: [lowestPostRollPiece, highestPostRollPiece],
          } as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.postRollDuration).toBe(highestPostRollPiece.postRollDuration)
        })
      })

      describe('previous Part should autoNext and have overlap', () => {
        it('don\'t have an inTransitionStart', () => {
          const previousPart: Part = EntityMockFactory.createPart({
            autoNext: {
              overlap: 1000,
            },
          } as PartInterface)

          const testee: Part = new Part({} as PartInterface)

          testee.calculateTimings(previousPart)

          const result: PartTimings = testee.getTimings()
          expect(result.inTransitionStart).toBeUndefined()
        })

        describe('"keepPreviousPartAliveDuration" is equal to the Part.autoNext.overlap and the Part has no "delayPiecesDuration"', () => {
          describe('previous Part have "keepAliveDuration"', () => {
            describe('the Part has no PreRoll', () => {
              it('returns previous Part.keepAliveDuration - the Part.autoNext.overlap for "delayStartOfPiecesDuration"', () => {
                const autoNextOverlap: number = 10
                const keepAliveDuration: number = 50
                const previousPart: Part = EntityMockFactory.createPart({
                  autoNext: {
                    overlap: autoNextOverlap,
                  },
                  outTransition: { keepAliveDuration },
                })

                const testee: Part = new Part({} as PartInterface)

                testee.calculateTimings(previousPart)

                const result: PartTimings = testee.getTimings()
                expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration - autoNextOverlap)
              })

              describe('the Part.autoOverlapNext is larger than previous Part.keepAlive', () => {
                it('returns zero for "delayStartOfPiecesDuration', () => {
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: 50,
                    },
                    outTransition: { keepAliveDuration: 30 },
                  })

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.delayStartOfPiecesDuration).toBe(0)
                })
              })

              describe('previous Part has PostRoll', () => {
                it('return "previousPartOutTransitionDuration" + the Part.autoNext.overlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
                  const autoNextOverlap: number = 10
                  const keepAliveDuration: number = 50
                  const postRollDuration: number = 100
                  const previousPart: Part = EntityMockFactory.createPart(
                    {
                      autoNext: {
                        overlap: autoNextOverlap,
                      },
                      outTransition: { keepAliveDuration },
                    },
                    { partTimings: { postRollDuration } }
                  )

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(
                    keepAliveDuration - autoNextOverlap + autoNextOverlap + postRollDuration
                  )
                })
              })

              describe('previous Part does not have PostRoll', () => {
                it('return "previousPartOutTransitionDuration" + the Part.autoNext.overlap for "previousPartContinueIntoPartDuration', () => {
                  const autoNextOverlap: number = 10
                  const keepAliveDuration: number = 50
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: autoNextOverlap,
                    },
                    outTransition: { keepAliveDuration },
                  })

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(
                    keepAliveDuration - autoNextOverlap + autoNextOverlap
                  )
                })
              })
            })

            describe('the Part has PreRoll', () => {
              describe('"previousPartOutTransitionDuration" is higher than the Part.preRoll', () => {
                it('returns keepAliveDuration - autoNext.overlap for "delayStartOfPiecesDuration"', () => {
                  const autoNextOverlap: number = 10
                  const keepAliveDuration: number = 50
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: autoNextOverlap,
                    },
                    outTransition: { keepAliveDuration },
                  })

                  const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
                  const preRollPiece: Piece = EntityMockFactory.createPiece({
                    preRollDuration: lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                  })
                  const testee: Part = new Part({
                    pieces: [preRollPiece],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration - autoNextOverlap)
                })

                describe('previous Part has PostRoll', () => {
                  it('return "previousPartOutTransitionDuration" + the Part.autoNext.overlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
                    const autoNextOverlap: number = 10
                    const keepAliveDuration: number = 50
                    const postRollDuration: number = 100
                    const previousPart: Part = EntityMockFactory.createPart(
                      {
                        autoNext: {
                          overlap: autoNextOverlap,
                        },
                        outTransition: { keepAliveDuration },
                      },
                      { partTimings: { postRollDuration } }
                    )

                    const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
                    const piece: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [piece],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.previousPartContinueIntoPartDuration).toBe(
                      keepAliveDuration - autoNextOverlap + autoNextOverlap + postRollDuration
                    )
                  })
                })

                describe('previous Part does not have PostRoll', () => {
                  it('return "previousPartOutTransitionDuration" + the Part.autoNext.overlap for "previousPartContinueIntoPartDuration', () => {
                    const autoNextOverlap: number = 10
                    const keepAliveDuration: number = 50
                    const previousPart: Part = EntityMockFactory.createPart({
                      autoNext: {
                        overlap: autoNextOverlap,
                      },
                      outTransition: { keepAliveDuration },
                    })

                    const lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 20
                    const piece: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												lowerPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [piece],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
                  })
                })
              })

              describe('"previousPartOutTransitionDuration" is lower than the Part.preRoll', () => {
                it('returns the Part.preRoll for "delayStartOfPiecesDuration', () => {
                  const autoNextOverlap: number = 10
                  const keepAliveDuration: number = 50
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: autoNextOverlap,
                    },
                    outTransition: { keepAliveDuration },
                  })

                  const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
                  const preRollPiece: Piece = EntityMockFactory.createPiece({
                    preRollDuration: higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                  })
                  const testee: Part = new Part({
                    pieces: [preRollPiece],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.delayStartOfPiecesDuration).toBe(
                    higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration
                  )
                })

                describe('previous Part has PostRoll', () => {
                  it('return the Part.preRoll + the Part.autoNext.overlap + previous Part.postRoll for "previousPartContinueIntoPartDuration', () => {
                    const autoNextOverlap: number = 10
                    const keepAliveDuration: number = 50
                    const postRollDuration: number = 100
                    const previousPart: Part = EntityMockFactory.createPart(
                      {
                        autoNext: {
                          overlap: autoNextOverlap,
                        },
                        outTransition: { keepAliveDuration },
                      },
                      { partTimings: { postRollDuration } }
                    )

                    const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
                    const preRollPiece: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [preRollPiece],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.previousPartContinueIntoPartDuration).toBe(
                      higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration +
												autoNextOverlap +
												postRollDuration
                    )
                  })
                })

                describe('previous Part does not have PostRoll', () => {
                  it('return "previousPartOutTransitionDuration" + the Part.autoNext.overlap for "previousPartContinueIntoPartDuration', () => {
                    const autoNextOverlap: number = 10
                    const keepAliveDuration: number = 50
                    const postRollDuration: number = 100
                    const previousPart: Part = EntityMockFactory.createPart(
                      {
                        autoNext: {
                          overlap: autoNextOverlap,
                        },
                        outTransition: { keepAliveDuration },
                      },
                      { partTimings: { postRollDuration } }
                    )

                    const higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration: number = 200
                    const preRollPiece: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [preRollPiece],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.previousPartContinueIntoPartDuration).toBe(
                      higherPreRollDurationThanAutoNextOverlapPlusKeepAliveDuration +
												autoNextOverlap +
												postRollDuration
                    )
                  })
                })
              })
            })
          })

          describe('previous Part does not have "keepAliveDuration"', () => {
            describe('the Part has PreRoll', () => {
              it('returns the Part.preRoll for "delayStartOfPiecesDuration', () => {
                const autoNextOverlap: number = 10
                const previousPart: Part = EntityMockFactory.createPart({
                  autoNext: {
                    overlap: autoNextOverlap,
                  },
                })

                const preRollDuration: number = 200
                const preRollPiece: Piece = EntityMockFactory.createPiece({
                  preRollDuration: preRollDuration,
                })
                const testee: Part = new Part({
                  pieces: [preRollPiece],
                } as PartInterface)

                testee.calculateTimings(previousPart)

                const result: PartTimings = testee.getTimings()
                expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
              })

              describe('previous Part have PostRoll', () => {
                it('returns the Part.preRoll + the Part.autoNext.overlap + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                  const autoNextOverlap: number = 10
                  const postRollDuration: number = 100
                  const previousPart: Part = EntityMockFactory.createPart(
                    {
                      autoNext: {
                        overlap: autoNextOverlap,
                      },
                    },
                    { partTimings: { postRollDuration } }
                  )

                  const preRollDuration: number = 200
                  const preRollPiece: Piece = EntityMockFactory.createPiece({
                    preRollDuration: preRollDuration,
                  })
                  const testee: Part = new Part({
                    pieces: [preRollPiece],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(
                    preRollDuration + autoNextOverlap + postRollDuration
                  )
                })
              })

              describe('previous Part does not have PostRoll', () => {
                it('returns the Part.preRoll + the Part.autoNext.overlap for "previousPartContinueIntoPartDuration"', () => {
                  const autoNextOverlap: number = 10
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: autoNextOverlap,
                    },
                  })

                  const preRollDuration: number = 200
                  const preRollPiece: Piece = EntityMockFactory.createPiece({
                    preRollDuration: preRollDuration,
                  })
                  const testee: Part = new Part({
                    pieces: [preRollPiece],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(
                    preRollDuration + autoNextOverlap
                  )
                })
              })
            })

            describe('the Part does not have PreRoll', () => {
              it('returns zero for "delayStartOfPiecesDuration', () => {
                const autoNextOverlap: number = 10
                const previousPart: Part = EntityMockFactory.createPart({
                  autoNext: {
                    overlap: autoNextOverlap,
                  },
                })

                const testee: Part = new Part({} as PartInterface)

                testee.calculateTimings(previousPart)

                const result: PartTimings = testee.getTimings()
                expect(result.delayStartOfPiecesDuration).toBe(0)
              })

              describe('previous Part have PostRoll', () => {
                it('returns the Part.autoNext.overlap + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                  const autoNextOverlap: number = 10
                  const postRollDuration: number = 100
                  const previousPart: Part = EntityMockFactory.createPart(
                    {
                      autoNext: {
                        overlap: autoNextOverlap,
                      },
                    } as PartInterface,
                    { partTimings: { postRollDuration } }
                  )

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(
                    autoNextOverlap + postRollDuration
                  )
                })
              })

              describe('previous Part does not have PostRoll', () => {
                it('returns the Part.autoNext.overlap for "previousPartContinueIntoPartDuration"', () => {
                  const autoNextOverlap: number = 10
                  const previousPart: Part = EntityMockFactory.createPart({
                    autoNext: {
                      overlap: autoNextOverlap,
                    },
                  })

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.previousPartContinueIntoPartDuration).toBe(autoNextOverlap)
                })
              })
            })
          })
        })
      })

      describe('previous Part should not autoNext', () => {
        describe('previous Part should disableNextInTransition', () => {
          it('don\'t have an inTransitionStart', () => {
            const previousPart: Part = EntityMockFactory.createPart({
              disableNextInTransition: true,
            })

            const testee: Part = new Part({} as PartInterface)

            testee.calculateTimings(previousPart)

            const result: PartTimings = testee.getTimings()
            expect(result.inTransitionStart).toBeUndefined()
          })
        })

        describe('previous Part should not disableNextTransition', () => {
          it('should have same inTransitionStart as pieces should be delayed', () => {
            const previousPart: Part = EntityMockFactory.createPart({
              disableNextInTransition: false,
            })

            const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
              preRollDuration: 10,
            })
            const testee: Part = new Part({
              pieces: [pieceWithPreRoll],
            } as PartInterface)

            testee.calculateTimings(previousPart)

            const result: PartTimings = testee.getTimings()

            expect(result.inTransitionStart).toBe(pieceWithPreRoll.preRollDuration)
          })

          describe('this Part has a keepPreviousPartAliveDuration', () => {
            describe('previous Part has a keep alive duration', () => {
              describe('the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration is higher than the Part\'s PreRoll - the Part.delayPiecesDuration', () => {
                it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration as "inTransitionStart"', () => {
                  const keepAliveDuration: number = 200
                  const previousPart: Part = EntityMockFactory.createPart({
                    outTransition: { keepAliveDuration },
                  })

                  const keepPreviousPartAliveDuration: number = 100
                  const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
                  const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                    preRollDuration:
											preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                  })
                  const testee: Part = new Part({
                    inTransition: { keepPreviousPartAliveDuration },
                    pieces: [pieceWithPreRoll],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(
                    keepAliveDuration - keepPreviousPartAliveDuration
                  )
                })

                describe('this Part does not have a delayPiecesDuration', () => {
                  it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration as "delayStartPiecesDuration"', () => {
                    const keepAliveDuration: number = 200
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const keepPreviousPartAliveDuration: number = 100
                    const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                    })
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration },
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(
                      keepAliveDuration - keepPreviousPartAliveDuration
                    )
                  })

                  describe('previous Part has a PostRollDuration', () => {
                    it('returns previous Part.keepAliveDuration + previous Part.postRollDuration as "previousPartContinueIntoPartDuration', () => {
                      const keepAliveDuration: number = 200
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {
                          outTransition: { keepAliveDuration },
                        },
                        { partTimings: { postRollDuration } }
                      )

                      const keepPreviousPartAliveDuration: number = 100
                      const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration:
													preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        keepAliveDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have a PostRollDuration', () => {
                    it('returns previous Part.keepAliveDuration as "previousPartContinueIntoPartDuration', () => {
                      const keepAliveDuration: number = 200
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: { keepAliveDuration },
                      })

                      const keepPreviousPartAliveDuration: number = 100
                      const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration:
													preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
                    })
                  })
                })

                describe('this Part do have a delayPiecesDuration', () => {
                  it('returns the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration + this Part.delayPiecesDuration as "delayStartOfPiecesDuration"', () => {
                    const keepAliveDuration: number = 200
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const keepPreviousPartAliveDuration: number = 100
                    const delayPiecesDuration: number = 20
                    const preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 50
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												preRollDurationLowerThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                    })
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(
                      keepAliveDuration - keepPreviousPartAliveDuration + delayPiecesDuration
                    )
                  })
                })
              })

              describe('the previous Part.keepAliveDuration - this Part.keepPreviousPartAliveDuration is lower than the Part\'s PreRoll - the Part.delayPiecesDuration', () => {
                it('returns this Part.preRoll as "inTransitionStart"', () => {
                  const keepAliveDuration: number = 210
                  const previousPart: Part = EntityMockFactory.createPart({
                    outTransition: { keepAliveDuration },
                  })

                  const keepPreviousPartAliveDuration: number = 100
                  const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
                  const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                    preRollDuration:
											preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                  })
                  const testee: Part = new Part({
                    inTransition: { keepPreviousPartAliveDuration },
                    pieces: [pieceWithPreRoll],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(
                    preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
                  )
                })

                describe('this Part does not have a delayPiecesDuration', () => {
                  it('returns the Part\'s PreRoll as "delayStartPiecesDuration"', () => {
                    const keepAliveDuration: number = 210
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const keepPreviousPartAliveDuration: number = 50
                    const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                    })
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration },
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(
                      preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
                    )
                  })

                  describe('previous Part has a PostRollDuration', () => {
                    it('returns this Part\'s PreRoll + this Part.keepPreviousPartAliveDuration + previous Part\'s PostRollDuration as "previousPartContinueIntoPartDuration', () => {
                      const keepAliveDuration: number = 210
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {
                          outTransition: { keepAliveDuration },
                        },
                        { partTimings: { postRollDuration } }
                      )

                      const keepPreviousPartAliveDuration: number = 50
                      const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration:
													preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration +
													keepPreviousPartAliveDuration +
													postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have a PostRollDuration', () => {
                    it('returns "preRollDurationConsideringDelay" + this Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration', () => {
                      const keepAliveDuration: number = 210
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: { keepAliveDuration },
                      })

                      const keepPreviousPartAliveDuration: number = 50
                      const preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration:
													preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration +
													keepPreviousPartAliveDuration
                      )
                    })
                  })
                })

                describe('this Part do have a delayPiecesDuration', () => {
                  it('returns the Part\'s PreRoll as "delayStartOfPiecesDuration"', () => {
                    const keepAliveDuration: number = 210
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const keepPreviousPartAliveDuration: number = 50
                    const delayPiecesDuration: number = 30
                    const preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration: number = 200
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration:
												preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration,
                    })
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(
                      preRollDurationMinusDelayPiecesDurationHigherThanKeepAliveDurationMinusKeepPreviousPartAliveDuration
                    )
                  })
                })
              })
            })

            describe('previous Part does not have a keep alive duration', () => {
              describe('this Part does not have PreRoll', () => {
                it('returns zero as "inTransitionStart"', () => {
                  const previousPart: Part = EntityMockFactory.createPart({})

                  const keepPreviousPartAliveDuration: number = 100
                  const testee: Part = new Part({
                    inTransition: { keepPreviousPartAliveDuration },
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(0)
                })

                describe('this Part has "delayPiecesDuration"', () => {
                  it('returns this Part.delayPiecesDuration for "delayStartOfPiecesDuration', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const keepPreviousPartAliveDuration: number = 50
                    const delayPiecesDuration: number = 100
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(delayPiecesDuration)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('return this Part.keepPreviousPartAliveDuration + previous Part PostRoll for "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const keepPreviousPartAliveDuration: number = 50
                      const delayPiecesDuration: number = 100
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        keepPreviousPartAliveDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns this Part.keepPreviousPartAliveDuration for "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const keepPreviousPartAliveDuration: number = 50
                      const delayPiecesDuration: number = 100
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        keepPreviousPartAliveDuration
                      )
                    })
                  })
                })

                describe('this Part does not have "delayPiecesDuration"', () => {
                  it('returns zero for "delayStartOfPiecesDuration"', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const keepPreviousPartAliveDuration: number = 50
                    const testee: Part = new Part({
                      inTransition: { keepPreviousPartAliveDuration },
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(0)
                  })
                })
              })

              describe('this Part has PreRoll', () => {
                it('returns this Part.preRoll as "inTransitionStart"', () => {
                  const previousPart: Part = EntityMockFactory.createPart({})

                  const keepPreviousPartAliveDuration: number = 50
                  const preRollDuration: number = 90
                  const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                    preRollDuration,
                  })
                  const testee: Part = new Part({
                    inTransition: { keepPreviousPartAliveDuration },
                    pieces: [pieceWithPreRoll],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(preRollDuration)
                })

                it('returns PreRoll duration as "delayStartOfPiecesDuration', () => {
                  const previousPart: Part = EntityMockFactory.createPart({})

                  const keepPreviousPartAliveDuration: number = 50
                  const preRollDuration: number = 90
                  const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                    preRollDuration,
                  })
                  const testee: Part = new Part({
                    inTransition: { keepPreviousPartAliveDuration },
                    pieces: [pieceWithPreRoll],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
                })

                describe('this Part has "delayPiecesDuration', () => {
                  describe('previous Part has PostRoll', () => {
                    it('returns the Part\'s PreRoll - the Part.delayPiecesDuration + this Part.keepPreviousPartAliveDuration + previous Part.postRoll as "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const keepPreviousPartAliveDuration: number = 50
                      const delayPiecesDuration: number = 80
                      const preRollDuration: number = 90
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration -
													delayPiecesDuration +
													keepPreviousPartAliveDuration +
													postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns the Part\'s PreRoll - the Part.delayPiecesDuration + this Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const keepPreviousPartAliveDuration: number = 50
                      const delayPiecesDuration: number = 80
                      const preRollDuration: number = 90
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration, delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration - delayPiecesDuration + keepPreviousPartAliveDuration
                      )
                    })
                  })
                })

                describe('this Part does not have "delayPiecesDuration"', () => {
                  describe('previous Part has PostRoll', () => {
                    it('returns the Part\'s PreRoll + the Part.keepPreviousPartAliveDuration + previous Part.postRoll as "previousPartContinueIntoPartDuration', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const keepPreviousPartAliveDuration: number = 50
                      const preRollDuration: number = 90
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration + keepPreviousPartAliveDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns the Part\'s PreRoll + the Part.keepPreviousPartAliveDuration as "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const keepPreviousPartAliveDuration: number = 50
                      const preRollDuration: number = 90
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { keepPreviousPartAliveDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration + keepPreviousPartAliveDuration
                      )
                    })
                  })
                })
              })
            })
          })

          describe('this Part does not have a keepPreviousPartAliveDuration', () => {
            describe('previous Part has "keepAliveDuration"', () => {
              describe('this Part does not have PreRoll', () => {
                it('returns previous Part.keepAlive as "inTransitionStart"', () => {
                  const keepAliveDuration: number = 200
                  const previousPart: Part = EntityMockFactory.createPart({
                    outTransition: { keepAliveDuration },
                  })

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(keepAliveDuration)
                })

                describe('this Part has "delayPiecesDuration"', () => {
                  it('returns previous Part.keepAliveDuration + this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
                    const keepAliveDuration: number = 200
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const delayPiecesDuration: number = 40
                    const testee: Part = new Part({
                      inTransition: { delayPiecesDuration },
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(
                      keepAliveDuration + delayPiecesDuration
                    )
                  })

                  describe('previous Part has PostRoll', () => {
                    it('returns previous Part.keepAliveDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const keepAliveDuration: number = 200
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {
                          outTransition: { keepAliveDuration },
                        },
                        { partTimings: { postRollDuration } }
                      )

                      const delayPiecesDuration: number = 40
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        keepAliveDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
                      const keepAliveDuration: number = 200
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: { keepAliveDuration },
                      })

                      const delayPiecesDuration: number = 40
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
                    })
                  })
                })

                describe('this Part does not have "delayPiecesDuration"', () => {
                  it('returns previous Part.keepAliveDuration for "delayStartOfPiecesDuration"', () => {
                    const keepAliveDuration: number = 200
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: { keepAliveDuration },
                    })

                    const testee: Part = new Part({} as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(keepAliveDuration)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('returns previous Part.keepAliveDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const keepAliveDuration: number = 200
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {
                          outTransition: { keepAliveDuration },
                        },
                        { partTimings: { postRollDuration } }
                      )

                      const testee: Part = new Part({} as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        keepAliveDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
                      const keepAliveDuration: number = 200
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: { keepAliveDuration },
                      })

                      const testee: Part = new Part({} as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(keepAliveDuration)
                    })
                  })
                })
              })

              describe('this Part has PreRoll', () => {
                describe('previous Part.keepAlive is higher than this Part.preRoll - the Part.delayPiecesDuration', () => {
                  it('returns previous Part.keepAlive as "inTransitionStart"', () => {
                    const keepAliveDurationHigherThanPreRollDuration: number = 200
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: {
                        keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
                      },
                    })

                    const preRollDuration: number = 100
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.inTransitionStart).toBe(
                      keepAliveDurationHigherThanPreRollDuration
                    )
                  })

                  describe('this Part has "delayPiecesDuration"', () => {
                    it('returns previous Part.keepAlive + this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
                      const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: {
                          keepAliveDuration:
														keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
                        },
                      })

                      const delayPiecesDuration: number = 40
                      const preRollDuration: number = 210
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.delayStartOfPiecesDuration).toBe(
                        keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration +
													delayPiecesDuration
                      )
                    })

                    describe('previous Part has PostRoll', () => {
                      it('returns previous Part.keepAlive + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
                        const postRollDuration: number = 70
                        const previousPart: Part = EntityMockFactory.createPart(
                          {
                            outTransition: {
                              keepAliveDuration:
																keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
                            },
                          },
                          { partTimings: { postRollDuration } }
                        )

                        const delayPiecesDuration: number = 40
                        const preRollDuration: number = 210
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration,
                        })
                        const testee: Part = new Part({
                          inTransition: { delayPiecesDuration },
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration +
														postRollDuration
                        )
                      })
                    })

                    describe('previous Part does not have PostRoll', () => {
                      it('returns previous Part.keepAliveDuration for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration: number = 200
                        const previousPart: Part = EntityMockFactory.createPart({
                          outTransition: {
                            keepAliveDuration:
															keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration,
                          },
                        })

                        const delayPiecesDuration: number = 40
                        const preRollDuration: number = 210
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration: preRollDuration,
                        })
                        const testee: Part = new Part({
                          inTransition: { delayPiecesDuration },
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          keepAliveDurationHigherThanPreRollDurationMinusDelayPiecesDuration
                        )
                      })
                    })
                  })

                  describe('this Part does not have "delayPiecesDuration"', () => {
                    it('returns previous Part.keepAlive for "delayStartOfPiecesDuration"', () => {
                      const keepAliveDurationHigherThanPreRollDuration: number = 200
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: {
                          keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
                        },
                      })

                      const preRollDuration: number = 90
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.delayStartOfPiecesDuration).toBe(
                        keepAliveDurationHigherThanPreRollDuration
                      )
                    })

                    describe('previous Part has PostRoll', () => {
                      it('returns previous Part.keepAlive + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationHigherThanPreRollDuration: number = 200
                        const postRollDuration: number = 70
                        const previousPart: Part = EntityMockFactory.createPart(
                          {
                            outTransition: {
                              keepAliveDuration:
																keepAliveDurationHigherThanPreRollDuration,
                            },
                          },
                          { partTimings: { postRollDuration } }
                        )

                        const preRollDuration: number = 90
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration,
                        })
                        const testee: Part = new Part({
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          keepAliveDurationHigherThanPreRollDuration + postRollDuration
                        )
                      })
                    })

                    describe('previous Part does not have PostRoll', () => {
                      it('returns previous Part.keepAlive for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationHigherThanPreRollDuration: number = 200
                        const previousPart: Part = EntityMockFactory.createPart({
                          outTransition: {
                            keepAliveDuration: keepAliveDurationHigherThanPreRollDuration,
                          },
                        })

                        const preRollDuration: number = 90
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration,
                        })
                        const testee: Part = new Part({
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          keepAliveDurationHigherThanPreRollDuration
                        )
                      })
                    })
                  })
                })

                describe('previous Part.keepAlive is lower than this Part.preRoll - the Part.delayPieces', () => {
                  it('returns this Part.preRoll as "inTransitionStart"', () => {
                    const keepAliveDurationLowerThanPreRollDuration: number = 100
                    const previousPart: Part = EntityMockFactory.createPart({
                      outTransition: {
                        keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
                      },
                    })

                    const preRollDuration: number = 200
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.inTransitionStart).toBe(preRollDuration)
                  })

                  describe('this Part has "delayPiecesDuration"', () => {
                    it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
                      const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: {
                          keepAliveDuration:
														keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
                        },
                      })

                      const delayPiecesDuration: number = 40
                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
                    })

                    describe('previous Part has PostRoll', () => {
                      it('returns this Part.preRollDuration - this Part.delayPiecesDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
                        const postRollDuration: number = 70
                        const previousPart: Part = EntityMockFactory.createPart(
                          {
                            outTransition: {
                              keepAliveDuration:
																keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
                            },
                          },
                          { partTimings: { postRollDuration } }
                        )

                        const delayPiecesDuration: number = 40
                        const preRollDuration: number = 200
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration,
                        })
                        const testee: Part = new Part({
                          inTransition: { delayPiecesDuration },
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          preRollDuration - delayPiecesDuration + postRollDuration
                        )
                      })
                    })

                    describe('previous Part does not have PostRoll', () => {
                      it('returns this Part.preRollDuration - this Part.delayPiecesDuration for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration: number = 100
                        const previousPart: Part = EntityMockFactory.createPart({
                          outTransition: {
                            keepAliveDuration:
															keepAliveDurationLowerThanPreRollDurationMinusDelayPiecesDuration,
                          },
                        })

                        const delayPiecesDuration: number = 40
                        const preRollDuration: number = 200
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration,
                        })
                        const testee: Part = new Part({
                          inTransition: { delayPiecesDuration },
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          preRollDuration - delayPiecesDuration
                        )
                      })
                    })
                  })

                  describe('this Part does not have "delayPiecesDuration"', () => {
                    it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
                      const keepAliveDurationLowerThanPreRollDuration: number = 100
                      const previousPart: Part = EntityMockFactory.createPart({
                        outTransition: {
                          keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
                        },
                      })

                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration: preRollDuration,
                      })
                      const testee: Part = new Part({
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
                    })

                    describe('previous Part has PostRoll', () => {
                      it('returns this Part.preRollDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationLowerThanPreRollDuration: number = 100
                        const postRollDuration: number = 70
                        const previousPart: Part = EntityMockFactory.createPart(
                          {
                            outTransition: {
                              keepAliveDuration:
																keepAliveDurationLowerThanPreRollDuration,
                            },
                          },
                          { partTimings: { postRollDuration } }
                        )

                        const preRollDuration: number = 200
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration: preRollDuration,
                        })
                        const testee: Part = new Part({
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          preRollDuration + postRollDuration
                        )
                      })
                    })

                    describe('previous Part does not have PostRoll', () => {
                      it('returns this Part.preRollDuration for "previousPartContinueIntoPartDuration"', () => {
                        const keepAliveDurationLowerThanPreRollDuration: number = 100
                        const previousPart: Part = EntityMockFactory.createPart({
                          outTransition: {
                            keepAliveDuration: keepAliveDurationLowerThanPreRollDuration,
                          },
                        })

                        const preRollDuration: number = 200
                        const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                          preRollDuration: preRollDuration,
                        })
                        const testee: Part = new Part({
                          pieces: [pieceWithPreRoll],
                        } as PartInterface)

                        testee.calculateTimings(previousPart)

                        const result: PartTimings = testee.getTimings()
                        expect(result.previousPartContinueIntoPartDuration).toBe(
                          preRollDuration
                        )
                      })
                    })
                  })
                })
              })
            })

            describe('previous Part does not have "keepAliveDuration"', () => {
              describe('this Part has PreRoll', () => {
                it('returns this Part.preRoll as "inTransitionStart"', () => {
                  const previousPart: Part = EntityMockFactory.createPart({})

                  const preRollDuration: number = 200
                  const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                    preRollDuration: preRollDuration,
                  })
                  const testee: Part = new Part({
                    pieces: [pieceWithPreRoll],
                  } as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(preRollDuration)
                })

                describe('this Part have "delayPiecesDuration"', () => {
                  it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const delayPiecesDuration: number = 40
                    const preRollDuration: number = 200
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration: preRollDuration,
                    })
                    const testee: Part = new Part({
                      inTransition: { delayPiecesDuration },
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('returns this Part.preRollDuration - this Part.delayPiecesDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const delayPiecesDuration: number = 40
                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration: preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration - delayPiecesDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns this Part.preRollDuration - this Part.delayPiecesDuration for "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const delayPiecesDuration: number = 40
                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration: preRollDuration,
                      })
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration - delayPiecesDuration
                      )
                    })
                  })
                })

                describe('this Part does not have "delayPiecesDuration"', () => {
                  it('returns this Part.preRollDuration for "delayStartOfPiecesDuration"', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const preRollDuration: number = 200
                    const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                      preRollDuration: preRollDuration,
                    })
                    const testee: Part = new Part({
                      pieces: [pieceWithPreRoll],
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(preRollDuration)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('returns this Part.preRollDuration + previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration: preRollDuration,
                      })
                      const testee: Part = new Part({
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(
                        preRollDuration + postRollDuration
                      )
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns this Part.preRollDuration for "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const preRollDuration: number = 200
                      const pieceWithPreRoll: Piece = EntityMockFactory.createPiece({
                        preRollDuration: preRollDuration,
                      })
                      const testee: Part = new Part({
                        pieces: [pieceWithPreRoll],
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(preRollDuration)
                    })
                  })
                })
              })

              describe('this Part does not have PreRoll', () => {
                it('returns zero as "inTransitionStart"', () => {
                  const previousPart: Part = EntityMockFactory.createPart({})

                  const testee: Part = new Part({} as PartInterface)

                  testee.calculateTimings(previousPart)

                  const result: PartTimings = testee.getTimings()
                  expect(result.inTransitionStart).toBe(0)
                })

                describe('this Part has "delayPiecesDuration"', () => {
                  it('returns this Part.delayPiecesDuration for "delayStartOfPiecesDuration"', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const delayPiecesDuration: number = 40
                    const testee: Part = new Part({
                      inTransition: { delayPiecesDuration },
                    } as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(delayPiecesDuration)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('return previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const previousPart: Part = EntityMockFactory.createPart(
                        {},
                        { partTimings: { postRollDuration } }
                      )

                      const delayPiecesDuration: number = 40
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(postRollDuration)
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns zero for "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const delayPiecesDuration: number = 40
                      const testee: Part = new Part({
                        inTransition: { delayPiecesDuration },
                      } as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(0)
                    })
                  })
                })

                describe('this Part does not have "delayPiecesDuration"', () => {
                  it('returns zero for "delayStartOfPiecesDuration"', () => {
                    const previousPart: Part = EntityMockFactory.createPart({})

                    const testee: Part = new Part({} as PartInterface)

                    testee.calculateTimings(previousPart)

                    const result: PartTimings = testee.getTimings()
                    expect(result.delayStartOfPiecesDuration).toBe(0)
                  })

                  describe('previous Part has PostRoll', () => {
                    it('returns previous Part.postRoll for "previousPartContinueIntoPartDuration"', () => {
                      const postRollDuration: number = 70
                      const pieceWithPostRoll: Piece = EntityMockFactory.createPiece({
                        postRollDuration,
                      })
                      const previousPart: Part = EntityMockFactory.createPart(
                        {
                          pieces: [pieceWithPostRoll],
                        },
                        { partTimings: { postRollDuration } }
                      )

                      const testee: Part = new Part({} as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(postRollDuration)
                    })
                  })

                  describe('previous Part does not have PostRoll', () => {
                    it('returns zero for "previousPartContinueIntoPartDuration"', () => {
                      const previousPart: Part = EntityMockFactory.createPart({})

                      const testee: Part = new Part({} as PartInterface)

                      testee.calculateTimings(previousPart)

                      const result: PartTimings = testee.getTimings()
                      expect(result.previousPartContinueIntoPartDuration).toBe(0)
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  describe(Part.prototype.markAsUnsynced.name, () => {
    describe('the Part is not planned', () => {
      it('is not marked as unsynced', () => {
        // A Part is planned if it has an "ingestedPart"
        const testee: Part = new Part({ isUnsynced: false, ingestedPart: undefined } as PartInterface)
        expect(testee.isUnsynced()).toBeFalsy()
        testee.markAsUnsynced()
        expect(testee.isUnsynced()).toBeFalsy()
      })
    })

    describe('the Part is planned', () => {
      it('marks the Part as unsynced',() => {
        const ingestedPart: IngestedPart = {} as IngestedPart
        const testee: Part = new Part({ isUnsynced: false, ingestedPart,  segmentId: 'someSegmentId' } as PartInterface)
        expect(testee.isUnsynced()).toBeFalsy()
        testee.markAsUnsynced()
        expect(testee.isUnsynced()).toBeTruthy()
      })

      it('sets the rank to one lower than the original rank', () => {
        const ingestedPart: IngestedPart = {} as IngestedPart
        const rank: number = 500
        const testee: Part = new Part({ rank, ingestedPart, segmentId: 'someSegmentId' } as PartInterface)
        testee.markAsUnsynced()
        expect(testee.getRank()).toBe(rank - 1)
      })

      describe('segment id already have the unsynced postfix', () => {
        const ingestedPart: IngestedPart = {} as IngestedPart
        it('does not add an extra postfix', () => {
          const segmentIdWithPostfix: string = `someSegmentId${UNSYNCED_ID_POSTFIX}`
          const testee: Part = new Part({ ingestedPart, segmentId: segmentIdWithPostfix } as PartInterface)
          testee.markAsUnsynced()
          expect(testee.getSegmentId()).toBe(segmentIdWithPostfix)
        })
      })

      it('marks all its Pieces as unsynced', () => {
        const pieceOne: Piece = EntityMockFactory.createPieceMock({ id: '1' } as PieceInterface)
        const pieceTwo: Piece = EntityMockFactory.createPieceMock({ id: '2' } as PieceInterface)
        const pieceThree: Piece = EntityMockFactory.createPieceMock({ id: '3' } as PieceInterface)

        const pieces: Piece[] = [
          instance(pieceOne),
          instance(pieceTwo),
          instance(pieceThree)
        ]

        const ingestedPart: IngestedPart = {} as IngestedPart
        const testee: Part = new Part({ pieces, ingestedPart, segmentId: 'segmentId' } as PartInterface)
        testee.markAsUnsynced()

        verify(pieceOne.markAsUnsyncedWithUnsyncedPart()).once()
        verify(pieceTwo.markAsUnsyncedWithUnsyncedPart()).once()
        verify(pieceThree.markAsUnsyncedWithUnsyncedPart()).once()
      })

      it('converts all its pieces into unsynced copies', () => {
        const pieceOne: Piece = EntityTestFactory.createPiece({ id: '1' } as PieceInterface)
        const pieceTwo: Piece = EntityTestFactory.createPiece({ id: '2' } as PieceInterface)
        const pieceThree: Piece = EntityTestFactory.createPiece({ id: '3' } as PieceInterface)

        const pieces: Piece[] = [pieceOne, pieceTwo, pieceThree]

        const ingestedPart: IngestedPart = {} as IngestedPart
        const testee: Part = new Part({ pieces, ingestedPart, segmentId: 'segmentId' } as PartInterface)

        testee.markAsUnsynced()

        expect(testee.getPieces()).not.toEqual(pieces)
        testee.getPieces().forEach(piece => expect(piece.id).toContain(UNSYNCED_ID_POSTFIX))
      })
    })
  })

  describe(Part.prototype.markAsUnsyncedWithUnsyncedSegment.name, () => {
    it('postfix the segment id with the unsynced postfix', () => {
      const segmentIdWithoutPostfix: string = 'someSegmentId'
      const testee: Part = new Part({ segmentId: segmentIdWithoutPostfix } as PartInterface)
      testee.markAsUnsyncedWithUnsyncedSegment()
      expect(testee.getSegmentId()).toBe(`${segmentIdWithoutPostfix}${UNSYNCED_ID_POSTFIX}`)
    })
  })

  describe(Part.prototype.setAsNext.name, () => {
    describe('when part is invalid', () => {
      it('throws an invalid part exception', () => {
        const invalidity: Invalidity = { reason: 'Some reason' }
        const testee: Part = EntityTestFactory.createPart({ invalidity })

        const result: () => void = () => testee.setAsNext()

        expect(result).toThrow(InvalidPartException)
      })
    })
  })
})

function createShallowIngestedPiece(id: string): IngestedPiece {
  return {
    id
  } as IngestedPiece
}
