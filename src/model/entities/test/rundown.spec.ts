import { Segment, SegmentInterface } from '../segment'
import { Rundown, RundownInterface } from '../rundown'
import { Part } from '../part'
import { Piece } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { EntityMockFactory } from './entity-mock-factory'
import { capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { NotActivatedException } from '../../exceptions/not-activated-exception'
import { NotFoundException } from '../../exceptions/not-found-exception'
import { LastPartInSegmentException } from '../../exceptions/last-part-in-segment-exception'
import { LastPartInRundownException } from '../../exceptions/last-part-in-rundown-exception'
import { AlreadyActivatedException } from '../../exceptions/already-activated-exception'
import { Owner } from '../../enums/owner'
import { EntityTestFactory } from './entity-test-factory'
import { AlreadyExistException } from '../../exceptions/already-exist-exception'
import { RundownCursor } from '../../value-objects/rundown-cursor'
import { UNSYNCED_ID_POSTFIX } from '../../value-objects/unsynced_constants'
import { OnAirException } from '../../exceptions/on-air-exception'
import { NoPartInHistoryException } from '../../exceptions/no-part-in-history-exception'
import { RundownMode } from '../../enums/rundown-mode'
import { AlreadyRehearsalException } from '../../exceptions/already-rehearsal-exception'

describe(Rundown.name, () => {
  describe('instantiate already active Rundown', () => {
    describe('"alreadyActiveProperties" is provided', () => {
      describe('active status is provided as false', () => {
        it('throws error', () => {
          const rundownInterface: RundownInterface = {
            mode: RundownMode.INACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: EntityMockFactory.createPart(),
                segment: EntityMockFactory.createSegment(),
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: EntityMockFactory.createPart(),
                segment: EntityMockFactory.createSegment(),
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface

          try {
            new Rundown(rundownInterface)
          } catch (error) {
            // Instantiation threw error, so all is well
            return
          }
          throw new Error(
            'Rundown didn\'t fail when instantiated with false active status and alreadyActiveProperties'
          )
        })
      })

      describe('active status is provided as true', () => {
        describe('it provides all necessary values', () => {
          it('sets all values', () => {
            const activePart: Part = EntityMockFactory.createPart({ id: 'activePart' })
            const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
            const activeSegment: Segment = EntityMockFactory.createSegment({
              id: 'activeSegment',
            })
            const nextSegment: Segment = EntityMockFactory.createSegment({
              id: 'nextSegment',
            })
            const piece: Piece = EntityMockFactory.createPiece({
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })

            const rundownInterface: RundownInterface = {
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: activePart,
                  segment: activeSegment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: nextPart,
                  segment: nextSegment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map([[piece.layer, piece]]),
              },
            } as RundownInterface

            const rundown: Rundown = new Rundown(rundownInterface)

            expect(rundown.getActivePart()).toBe(activePart)
            expect(rundown.getNextPart()).toBe(nextPart)
            expect(rundown.getActiveSegment()).toBe(activeSegment)
            expect(rundown.getNextSegment()).toBe(nextSegment)
            expect(rundown.getInfinitePieces()).toContain(piece)
          })
        })
      })
    })
  })

  describe(Rundown.prototype.takeNext.name, () => {
    describe('it has a next Part', () => {
      it('sets the next Part as the active Part', () => {
        const firstPart: Part = EntityMockFactory.createPart({
          id: 'firstPartId',
        })
        const nextPart: Part = EntityMockFactory.createPart({
          id: 'nextPartId',
        })
        const segment: Segment = EntityMockFactory.createSegment(
          {},
          {
            firstPart,
            nextPart,
          }
        )

        const testee: Rundown = new Rundown({
          segments: [segment],
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part: firstPart,
              segment,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              part: nextPart,
              segment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
        } as RundownInterface)

        const activeBefore: Part = testee.getActivePart()

        testee.takeNext()

        const activeAfter: Part = testee.getActivePart()

        expect(activeBefore.id).not.toBe(activeAfter.id)
      })

      it('calls "PutOnAir" on the next Part', () => {
        const firstPart: Part = EntityMockFactory.createPart({
          id: 'firstPartId',
        })
        const mockNextPart: Part = EntityMockFactory.createPartMock({
          id: 'nextPartId',
        })
        const nextPart: Part = instance(mockNextPart)
        const segment: Segment = EntityMockFactory.createSegment(
          {},
          {
            firstPart,
            nextPart,
          }
        )

        const testee: Rundown = new Rundown({
          segments: [segment],
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part: firstPart,
              segment,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              part: nextPart,
              segment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
        } as RundownInterface)

        testee.takeNext()

        verify(mockNextPart.putOnAir()).once()
      })

      describe('it has an active Part', () => {
        it('sets the active Part as the previous Part', () => {
          const activePart: Part = EntityTestFactory.createPart({ id: 'activePartId', isOnAir: true })
          activePart.calculateTimings()
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId' })
          const segment: Segment = EntityTestFactory.createSegment({ parts: [activePart, nextPart] })

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment,
                part: activePart,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                segment,
                part: nextPart,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          } as RundownInterface)

          expect(testee.getPreviousPart()).toBeUndefined()

          testee.takeNext()

          expect(testee.getPreviousPart()?.id).toBe(activePart.id)
        })

        it('adds the new previous Part to the history', () => {
          const activePart: Part = EntityTestFactory.createPart({ id: 'activePartId', isOnAir: true })
          activePart.calculateTimings()
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId' })
          const segment: Segment = EntityTestFactory.createSegment({ parts: [activePart, nextPart] })

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment,
                part: activePart,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                segment,
                part: nextPart,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          } as RundownInterface)

          expect(testee.getHistory().find(part => part.id === activePart.id)).toBeUndefined()

          testee.takeNext()

          expect(testee.getHistory().find(part => part.id === activePart.id)).not.toBeUndefined()
        })

        describe('when next segment is the same as the on air segment', () => {
          it('keeps the executed at epoch time for the segment', () => {
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPartId', isOnAir: true, timings: {
              inTransitionStart: 0,
              delayStartOfPiecesDuration: 0,
              postRollDuration: 0,
              previousPartContinueIntoPartDuration: 0,
            } })
            const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId', isNext: true })
            const executedAtEpochTime: number = 1234
            const onAirAndNextSegment: Segment = EntityTestFactory.createSegment({ id: 'onAirAndNextSegmentId', isOnAir: true, isNext: true, parts: [onAirPart, nextPart], executedAtEpochTime })

            const testee: Rundown = new Rundown({
              segments: [onAirAndNextSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: onAirAndNextSegment,
                  part: onAirPart,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  segment: onAirAndNextSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map()
              }
            } as RundownInterface)

            testee.takeNext()

            expect(onAirAndNextSegment.getExecutedAtEpochTime()).toBe(executedAtEpochTime)
          })
        })

        describe('when next segment is different from the on air segment', () => {
          beforeEach(() => jest.useFakeTimers())
          afterEach(() => jest.useRealTimers())

          it('sets the executed at epoch time for the next segment', () => {
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPartId', isOnAir: true, timings: {
              inTransitionStart: 0,
              delayStartOfPiecesDuration: 0,
              postRollDuration: 0,
              previousPartContinueIntoPartDuration: 0,
            } })
            const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId', isNext: true })
            const executedAtEpochTime: number = 1234
            const onAirSegment: Segment = EntityTestFactory.createSegment({ id: 'onAirSegmentId', isOnAir: true, parts: [onAirPart], executedAtEpochTime })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'nextSegmentId', isNext: true, parts: [nextPart], executedAtEpochTime: undefined })

            const testee: Rundown = new Rundown({
              segments: [onAirSegment, nextSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: onAirSegment,
                  part: onAirPart,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  segment: nextSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map()
              }
            } as RundownInterface)

            const currentEpochTime: number = Date.now()
            testee.takeNext()

            expect(nextSegment.getExecutedAtEpochTime()).toBe(currentEpochTime)
          })
        })

        describe('history has exceed maximum history entries', () => {
          it('removes the oldest entries to get down to maximum entries', () => {
            const activePart: Part = EntityTestFactory.createPart({ id: 'activePartId', isOnAir: true })
            activePart.calculateTimings()
            const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId' })
            const segment: Segment = EntityTestFactory.createSegment({ parts: [activePart, nextPart] })

            const historyPartIdPrefix: string = 'partId_'

            const maximumHistoryEntries: number = 30 // Maximum entries is at the time of writing 30.
            const numberToExceedHistory: number = 5

            const history: Part[] = []
            for (let i = 0; i < maximumHistoryEntries + numberToExceedHistory; i++) {
              history.push(EntityTestFactory.createPart({ id: `${historyPartIdPrefix}${i}`}))
            }

            const testee: Rundown = new Rundown({
              history,
              segments: [segment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment,
                  part: activePart,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  segment,
                  part: nextPart,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map()
              }
            } as RundownInterface)

            expect(testee.getHistory()).toHaveLength(maximumHistoryEntries + numberToExceedHistory)
            for (let i = 0; i < numberToExceedHistory; i++) {
              expect(testee.getHistory()[i].id).toBe(`${historyPartIdPrefix}${i}`)
            }

            testee.takeNext()

            expect(testee.getHistory()).toHaveLength(maximumHistoryEntries)

            for (let i = 0; i < numberToExceedHistory; i++) {
              expect(testee.getHistory()[i].id).not.toBe(`${historyPartIdPrefix}${i}`)
            }

            expect(testee.getHistory()[testee.getHistory().length - 1].id).toBe(activePart.id)
          })
        })
      })

      describe('it does not have an active Part', () => {
        it('does not set any Part as previous', () => {
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPartId' })
          const segment: Segment = EntityTestFactory.createSegment({ parts: [nextPart] })

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              nextCursor: {
                segment,
                part: nextPart,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          } as RundownInterface)

          expect(testee.getPreviousPart()).toBeUndefined()

          testee.takeNext()

          expect(testee.getPreviousPart()).toBeUndefined()
        })
      })
    })

    describe('next Part has no infinite Pieces', () => {
      it('does not add any infinite Pieces', () => {
        const partWithoutPieces: Part = EntityMockFactory.createPart()
        const segment: Segment = EntityMockFactory.createSegment(
          {},
          {
            nextPart: partWithoutPieces,
          }
        )

        const testee: Rundown = new Rundown({
          segments: [segment],
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part: segment.findFirstPart(),
              segment,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              part: partWithoutPieces,
              segment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
        } as RundownInterface)

        testee.takeNext()

        const result: Piece[] = testee.getInfinitePieces()
        expect(result).toHaveLength(0)
      })
    })

    describe('Rundown has Part with infinite Pieces', () => {
      describe('it has two Pieces on different layers', () => {
        it('adds both infinite Pieces', () => {
          const pieceOne: Piece = EntityMockFactory.createPiece({
            layer: 'someLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const pieceTwo: Piece = EntityMockFactory.createPiece({
            layer: 'someOtherLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            pieces: [pieceOne, pieceTwo],
          })
          const segment: Segment = EntityMockFactory.createSegment(
            {},
            {
              nextPart: nextPart,
            }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: segment.findFirstPart(),
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(2)
          expect(result).toContain(pieceOne)
          expect(result).toContain(pieceTwo)
        })
      })
    })

    describe('Rundown has two Parts with infinite Pieces', () => {
      describe('Each Part has an infinite Piece on a different layer', () => {
        it('adds both Pieces', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            layer: 'someLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPiece: Piece = EntityMockFactory.createPiece({
            layer: 'someOtherLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'first',
            pieces: [firstPiece],
          })
          const nextPart: Part = EntityMockFactory.createPart({
            id: 'next',
            pieces: [nextPiece],
          })
          const segment: Segment = EntityMockFactory.createSegment(
            {},
            {
              firstPart,
              nextPart,
              firstSpanningPieceForEachLayerBeforePart: [firstPiece],
            }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(2)
          expect(result).toContainEqual(firstPiece)
          expect(result).toContainEqual(nextPiece)
        })
      })

      describe('Each Part has an infinite Piece on the same layer', () => {
        it('only adds the last infinite Piece', () => {
          const layer: string = 'someLayer'

          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'p1',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'p2',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            pieces: [nextPiece],
          })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock(
            {},
            {
              firstPart,
              nextPart,
            }
          )
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)

          const [partToSearchBefore, layersToIgnore] = capture(
            mockedSegment.getFirstSpanningPieceForEachLayerBeforePart
          ).last()
          expect(partToSearchBefore).toBe(nextPart)
          expect(layersToIgnore.has(layer)).toBeTruthy()
        })

        it('sets executedAt to zero for the Piece no longer being an infinite', () => {
          const layer: string = 'someLayer'

          const mockFirstPiece: Piece = EntityMockFactory.createPieceMock({
            id: 'p1',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPiece: Piece = instance(mockFirstPiece)
          const firstPart: Part = EntityMockFactory.createPart({
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'p2',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            pieces: [nextPiece],
          })

          const segment: Segment = EntityMockFactory.createSegment(
            {},
            {
              firstPart,
              nextPart,
            }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          verify(mockFirstPiece.resetExecutedAt()).once()
        })
      })
    })

    describe('Rundown has two Segments', () => {
      describe('Each Segment has an infinite Piece on different layers', () => {
        it('adds both infinite Pieces', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            layer: 'someLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment(
            { id: 'firstSegment', parts: [firstPart] },
            { firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
          )

          const nextPiece: Piece = EntityMockFactory.createPiece({
            layer: 'someOtherLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(2)
          expect(result).toContainEqual(firstPiece)
          expect(result).toContainEqual(nextPiece)
        })
      })

      describe('Each Segment has an infinite Piece on the same layer', () => {
        it('only adds the last infinite piece', () => {
          const layer: string = 'someLayer'

          const firstPiece: Piece = EntityMockFactory.createPiece({
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({ pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityMockFactory.createPart({ pieces: [nextPiece] })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })
    })

    describe('Rundown has three Segments', () => {
      describe('middle Segment is a valid Segment for execution', () => {
        it('finds the middle Segment as the next nextSegment', () => {
          const firstPart: Part = EntityTestFactory.createPart({ id: 'firstPart' })
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
          const firstSegment: Segment = EntityTestFactory.createSegment({ id: 'firstSegment', parts: [firstPart, nextPart] })

          const middleSegment: Segment = EntityTestFactory.createSegment({ id: 'middleSegment', parts: [EntityTestFactory.createPart()] })
          const lastSegment: Segment = EntityTestFactory.createSegment({ id: 'lastSegment', parts: [EntityTestFactory.createPart()] })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              }
            }
          } as RundownInterface)

          expect(testee.getNextSegment().id).toBe(firstSegment.id)

          testee.takeNext()

          expect(testee.getNextSegment().id).toBe(middleSegment.id)
        })
      })

      describe('middle Segment is hidden', () => {
        it('skips the middle Segment when finding the next nextSegment', () => {
          const firstPart: Part = EntityTestFactory.createPart({ id: 'firstPart' })
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
          const firstSegment: Segment = EntityTestFactory.createSegment({ id: 'firstSegment', parts: [firstPart, nextPart] })

          const middleSegment: Segment = EntityTestFactory.createSegment({ id: 'middleSegment', isHidden: true, parts: [EntityTestFactory.createPart()] })
          const lastSegment: Segment = EntityTestFactory.createSegment({ id: 'lastSegment', parts: [EntityTestFactory.createPart()] })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              }
            }
          } as RundownInterface)

          expect(testee.getNextSegment().id).toBe(firstSegment.id)

          testee.takeNext()

          expect(testee.getNextSegment().id).toBe(lastSegment.id)
        })
      })

      describe('middle Segment does not have any Parts', () => {
        it('skips the middle Segment when finding the next nextSegment', () => {
          const firstPart: Part = EntityTestFactory.createPart({ id: 'firstPart' })
          const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
          const firstSegment: Segment = EntityTestFactory.createSegment({ id: 'firstSegment', parts: [firstPart, nextPart] })

          const middleSegment: Segment = EntityTestFactory.createSegment({ id: 'middleSegment', parts: [] })
          const lastSegment: Segment = EntityTestFactory.createSegment({ id: 'lastSegment', parts: [EntityTestFactory.createPart()] })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              }
            }
          } as RundownInterface)

          expect(testee.getNextSegment().id).toBe(firstSegment.id)

          testee.takeNext()

          expect(testee.getNextSegment().id).toBe(lastSegment.id)
        })
      })
    })

    describe('Rundown has a "sticky Rundown" infinite Piece', () => {
      describe('Rundown "skips" a Segment that also has a "sticky" infinite Piece', () => {
        it('does not change the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityMockFactory.createSegment({
            id: 'middleSegment',
            parts: [middlePart],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it jumps "back" up the Rundown and "skips" a Segment with a "sticky Rundown" infinite Piece', () => {
        it('does not change the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityMockFactory.createSegment({
            id: 'middleSegment',
            parts: [middlePart],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Segment with a "sticky Rundown" infinite Piece for the same layer', () => {
        it('changes the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Segment with a "spanning Rundown" infinite Piece', () => {
        it('changes to the "spanning" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })
    })

    describe('Rundown has a "spanning Rundown" infinite Piece', () => {
      describe('it "skips" a Segment with a "spanning Rundown" infinite Piece"', () => {
        it('changes to the "spanning" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityMockFactory.createSegment(
            { id: 'middleSegment', parts: [middlePart] },
            { firstSpanningRundownPieceForEachLayerForAllParts: [middlePiece] }
          )

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })

        it('sets executedAt on the taken infinite Piece', () => {
          const now: number = Date.now()
          jest.useFakeTimers().setSystemTime(now)

          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const mockMiddlePiece: Piece = EntityMockFactory.createPieceMock({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const middlePiece: Piece = instance(mockMiddlePiece)
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityMockFactory.createSegment(
            { id: 'middleSegment', parts: [middlePart] },
            { firstSpanningRundownPieceForEachLayerForAllParts: [middlePiece] }
          )

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map(),
            },
          } as RundownInterface)

          testee.takeNext()

          verify(mockMiddlePiece.setExecutedAt(now)).once()
        })
      })

      describe('it jumps "back" up the Rundown before the "spanning" infinite Piece', () => {
        describe('there is a previous "spanning" infinite Piece', () => {
          it('selects the previous "spanning" Piece', () => {
            const layer: string = 'someLayer'
            const firstPiece: Piece = EntityMockFactory.createPiece({
              id: 'firstPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const firstPart: Part = EntityMockFactory.createPart({
              id: 'firstPart',
              pieces: [firstPiece],
            })
            const firstSegment: Segment = EntityMockFactory.createSegment(
              { id: 'firstSegment', parts: [firstPart] },
              { firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
            )

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
            const middleSegment: Segment = EntityMockFactory.createSegment({
              id: 'middleSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const lastPart: Part = EntityMockFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })
            const lastSegment: Segment = EntityMockFactory.createSegment({
              id: 'lastSegment',
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown({
              segments: [firstSegment, middleSegment, lastSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment: lastSegment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment: middleSegment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map(),
              },
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(1)
            expect(result).toContainEqual(firstPiece)
          })
        })

        describe('there are no other "spanning" infinite Pieces', () => {
          it('has no longer any infinite Pieces', () => {
            const layer: string = 'someLayer'
            const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
            const firstSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [firstPart],
            })

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
            const middleSegment: Segment = EntityMockFactory.createSegment({
              id: 'middleSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const lastPart: Part = EntityMockFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })
            const lastSegment: Segment = EntityMockFactory.createSegment({
              id: 'lastSegment',
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown({
              segments: [firstSegment, middleSegment, lastSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment: lastSegment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment: middleSegment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map(),
              },
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(0)
          })
        })
      })

      describe('it takes a Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('takes the "stickyThenSpanning" Piece', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('"skips" a Segment with a "stickyThenSpanning infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment(
            { id: 'firstSegment', parts: [firstPart] },
            { firstSpanningRundownPieceForEachLayerForAllParts: [firstPiece] }
          )

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })
          const middleSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [middlePart],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })
    })

    describe('Rundown has an infinite "Rundown" Piece', () => {
      describe('it takes a Segment with a non-infinite Piece for same layer', () => {
        it('no longer has any infinite Pieces', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.WITHIN_PART,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(0)
        })
      })
    })

    describe('Rundown has a "sticky segment" infinite Piece', () => {
      describe('it takes another "sticky segment" infinite Piece within the Segment', () => {
        it('changes the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, nextPart],
          })
          when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it "skips" a Part within the Segment that has a "sticky segment" infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, middlePart, lastPart],
          })
          when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it jumps "back" up the Segment before another "sticky segment" infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })

          const mockSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, middlePart, lastPart],
          })
          when(mockSegment.doesPieceBelongToSegment(lastPiece)).thenReturn(true)
          const segment: Segment = instance(mockSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Part within the Segment with a "spanning segment" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, nextPart],
          })
          when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it takes a Part within segment with "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const nextPart: Part = EntityMockFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, nextPart],
          })
          when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it "skips" a Part within the Segment with "stickyThenSpanning" infinite Piece', () => {
        it('does not change the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
          })

          const mockedSegment: Segment = EntityMockFactory.createSegmentMock({
            id: 'segment',
            parts: [firstPart, middlePart, lastPart],
          })
          when(mockedSegment.doesPieceBelongToSegment(firstPiece)).thenReturn(true)
          const segment: Segment = instance(mockedSegment)

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it changes Segment', () => {
        it('no longer have any infinite Pieces', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(0)
        })
      })
    })

    describe('Rundown has a "spanning segment" infinite Piece', () => {
      describe('it "skips" a Part within the Segment that has a "spanning segment" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

          const segment: Segment = EntityMockFactory.createSegment(
            { id: 'segment', parts: [firstPart, middlePart, lastPart] },
            { firstSpanningPieceForEachLayerBeforePart: [middlePiece] }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })

        it('sets executedAt on taken infinite Piece', () => {
          const now: number = Date.now()
          jest.useFakeTimers().setSystemTime(now)

          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const mockMiddlePiece: Piece = EntityMockFactory.createPieceMock({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const middlePiece: Piece = instance(mockMiddlePiece)
          const middlePart: Part = EntityMockFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })

          const segment: Segment = EntityMockFactory.createSegment(
            { id: 'segment', parts: [firstPart, middlePart, lastPart] },
            { firstSpanningPieceForEachLayerBeforePart: [middlePiece] }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            }
          } as RundownInterface)

          testee.takeNext()

          verify(mockMiddlePiece.setExecutedAt(now)).once()
        })
      })

      describe('it jumps "back" up the Segment before the Part with the spanning Segment', () => {
        describe('there is a previous "spanning segment" infinite Piece', () => {
          it('changes to the previous "spanning" infinite Piece', () => {
            const layer: string = 'someLayer'
            const firstPiece: Piece = EntityMockFactory.createPiece({
              id: 'firstPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const firstPart: Part = EntityMockFactory.createPart({
              id: 'firstPart',
              pieces: [firstPiece],
            })

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const lastPart: Part = EntityMockFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })

            const segment: Segment = EntityMockFactory.createSegment(
              { id: 'segment', parts: [firstPart, middlePart, lastPart] },
              { firstSpanningPieceForEachLayerBeforePart: [firstPiece] }
            )

            const testee: Rundown = new Rundown({
              segments: [segment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
              }
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(1)
            expect(result).toContainEqual(firstPiece)
          })
        })

        describe('there are no previous "spanning" infinite Pieces', () => {
          it('no longer have any infinite Pieces', () => {
            const layer: string = 'someLayer'
            const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const lastPart: Part = EntityMockFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })

            const segment: Segment = EntityMockFactory.createSegment({
              id: 'segment',
              parts: [firstPart, middlePart, lastPart],
            })

            const testee: Rundown = new Rundown({
              segments: [segment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
              }
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(0)
          })
        })
      })

      describe('it takes a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const lastPiece: Piece = EntityMockFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })

          const segment: Segment = EntityMockFactory.createSegment({
            id: 'segment',
            parts: [firstPart, lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(lastPiece)
        })
      })

      describe('it "skips" a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })

          const lastPart: Part = EntityMockFactory.createPart({
            id: 'lastPart',
          })

          const segment: Segment = EntityMockFactory.createSegment(
            { id: 'segment', parts: [firstPart, middlePart, lastPart] },
            { firstSpanningPieceForEachLayerBeforePart: [middlePiece] }
          )

          const testee: Rundown = new Rundown({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })
      })

      describe('it changes Segment', () => {
        it('no longer have any infinite Pieces', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityMockFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart' })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            },
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(0)
        })
      })
    })

    describe('Rundown has a "stickyThenSpanning" infinite Piece', () => {
      describe('it takes another Segment with a "spanningThenSticky" infinite Piece', () => {
        it('changes infinite Piece', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityMockFactory.createPiece({
            id: 'nextPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const nextPart: Part = EntityMockFactory.createPart({ id: 'nextPart', pieces: [nextPiece] })
          const nextSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, nextSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: nextPart,
                segment: nextSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            }
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toContainEqual(nextPiece)
        })
      })

      describe('it "skips" a Segment with a "spanningThenSticky" infinite Piece', () => {
        it('does not change the infinite Piece', () => {
          const firstPiece: Piece = EntityMockFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
          const firstSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityMockFactory.createPiece({
            id: 'middlePiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart', pieces: [middlePiece] })
          const middleSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [middlePart],
          })

          const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart' })
          const lastSegment: Segment = EntityMockFactory.createSegment({
            id: 'firstSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown({
            segments: [firstSegment, middleSegment, lastSegment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                part: firstPart,
                segment: firstSegment,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                part: lastPart,
                segment: lastSegment,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map([[firstPiece.layer, firstPiece]]),
            }
          } as RundownInterface)

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toContainEqual(firstPiece)
        })
      })

      describe('it "jumps back up" the Rundown before its "spanningThenSticky" infinite Piece', () => {
        describe('there is a previous "spanningThenSticky" infinite Piece', () => {
          it('keeps the first "spanningThenSticky" Piece', () => {
            const firstPiece: Piece = EntityMockFactory.createPiece({
              id: 'firstPiece',
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart', pieces: [firstPiece] })
            const firstSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [firstPart],
            })

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
            const middleSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
            const lastSegment: Segment = EntityMockFactory.createSegment(
              { id: 'firstSegment', parts: [lastPart] },
              { firstSpanningPieceForEachLayerBeforePart: [lastPiece] }
            )

            const testee: Rundown = new Rundown({
              segments: [firstSegment, middleSegment, lastSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment: lastSegment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment: middleSegment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
              }
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toContainEqual(lastPiece)
          })
        })

        describe('there is no other "spanningThenSticky" infinite Piece', () => {
          it('keeps the first "spanningThenSticky" Piece', () => {
            const firstPart: Part = EntityMockFactory.createPart({ id: 'firstPart' })
            const firstSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [firstPart],
            })

            const middlePart: Part = EntityMockFactory.createPart({ id: 'middlePart' })
            const middleSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const lastPart: Part = EntityMockFactory.createPart({ id: 'lastPart', pieces: [lastPiece] })
            const lastSegment: Segment = EntityMockFactory.createSegment({
              id: 'firstSegment',
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown({
              segments: [firstSegment, middleSegment, lastSegment],
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  part: lastPart,
                  segment: lastSegment,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  part: middlePart,
                  segment: middleSegment,
                  owner: Owner.SYSTEM
                },
                infinitePieces: new Map([[lastPiece.layer, lastPiece]]),
              }
            } as RundownInterface)

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toContainEqual(lastPiece)
          })
        })
      })
    })
  })

  describe(Rundown.prototype.getPartAfter.name, () => {
    describe('rundown is not active', () => {
      it('throws NotActivatedException', () => {
        const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE } as RundownInterface)
        expect(() => testee.getPartAfter(instance(mock(Part)))).toThrow(NotActivatedException)
      })
    })

    describe('rundown is active', () => {
      describe('Part does not belong to any Segments of the Rundown', () => {
        it('throws error', () => {
          const partNotInAnySegments: Part = EntityMockFactory.createPart({
            segmentId: 'nonExistingSegmentId',
          })
          const segments: Segment[] = [
            EntityMockFactory.createSegment({ id: 'segmentOne' }),
            EntityMockFactory.createSegment({ id: 'segmentTwo' }),
          ]

          const testee: Rundown = new Rundown({ mode: RundownMode.ACTIVE, segments } as RundownInterface)

          expect(() => testee.getPartAfter(partNotInAnySegments)).toThrow(NotFoundException)
        })
      })

      describe('Segment of Part still have Parts after the Part', () => {
        it('returns the next Part in the Segment', () => {
          const segmentId: string = 'segmentId'
          const part: Part = EntityMockFactory.createPart({ segmentId })
          const nextPartInSegment: Part = EntityMockFactory.createPart({})
          const segment: Segment = EntityMockFactory.createSegment(
            { id: segmentId, parts: [part, nextPartInSegment] },
            { nextPart: nextPartInSegment }
          )

          const testee: Rundown = new Rundown({
            mode: RundownMode.ACTIVE,
            segments: [segment],
          } as RundownInterface)

          const result: Part = testee.getPartAfter(part)
          expect(result).toBe(nextPartInSegment)
        })
      })

      describe('Segment does not have any Parts after the Part', () => {
        describe('Rundown has another Segment following the Segment of the Part', () => {
          it('returns the first Part of the following Segment', () => {
            const firstSegmentId: string = 'firstSegmentId'
            const part: Part = EntityMockFactory.createPart({ segmentId: firstSegmentId })
            const firstSegmentMock: Segment = EntityMockFactory.createSegmentMock({
              id: firstSegmentId,
              parts: [part],
            })
            when(firstSegmentMock.findNextPart(part)).thenThrow(new LastPartInSegmentException(''))
            const firstSegment: Segment = instance(firstSegmentMock)

            const secondSegmentId: string = 'secondSegmentId'
            const firstPartInSecondSegment: Part = EntityMockFactory.createPart({
              segmentId: secondSegmentId,
            })
            const secondSegment: Segment = EntityMockFactory.createSegment(
              { id: firstSegmentId, parts: [firstPartInSecondSegment] },
              { firstPart: firstPartInSecondSegment }
            )

            const testee: Rundown = new Rundown({
              mode: RundownMode.ACTIVE,
              segments: [firstSegment, secondSegment],
            } as RundownInterface)

            const result: Part = testee.getPartAfter(part)
            expect(result).toBe(firstPartInSecondSegment)
          })
        })

        describe('following Segment does not have any Parts', () => {
          it('returns the first Part of the Segment after the following Segment', () => {
            const firstSegmentId: string = 'firstSegmentId'
            const part: Part = EntityMockFactory.createPart({ segmentId: firstSegmentId })
            const firstSegmentMock: Segment = EntityMockFactory.createSegmentMock({
              id: firstSegmentId,
              parts: [part],
            })
            when(firstSegmentMock.findNextPart(part)).thenThrow(new LastPartInSegmentException(''))
            const firstSegment: Segment = instance(firstSegmentMock)

            const secondSegmentMock: Segment = EntityMockFactory.createSegmentMock({ id: 'secondSegmentId', parts: [] })

            const thirdSegmentId: string = 'thirdSegmentId'
            const firstPartInThirdSegment: Part = EntityMockFactory.createPart({
              segmentId: thirdSegmentId,
            })
            const thirdSegment: Segment = EntityMockFactory.createSegment(
              { id: firstSegmentId, parts: [firstPartInThirdSegment] },
              { firstPart: firstPartInThirdSegment }
            )

            const testee: Rundown = new Rundown({
              mode: RundownMode.ACTIVE,
              segments: [firstSegment, instance(secondSegmentMock), thirdSegment],
            } as RundownInterface)

            const result: Part = testee.getPartAfter(part)

            verify(secondSegmentMock.getParts()).once()
            expect(result).toBe(firstPartInThirdSegment)
          })
        })

        describe('Segment is the last Segment of the Rundown', () => {
          it('throws error', () => {
            const firstSegmentId: string = 'firstSegmentId'
            const part: Part = EntityMockFactory.createPart({ segmentId: firstSegmentId })
            const firstSegmentMock: Segment = EntityMockFactory.createSegmentMock({
              id: firstSegmentId,
              parts: [part],
            })
            when(firstSegmentMock.findNextPart(part)).thenThrow(new LastPartInSegmentException(''))
            const firstSegment: Segment = instance(firstSegmentMock)

            const testee: Rundown = new Rundown({
              mode: RundownMode.ACTIVE,
              segments: [firstSegment],
            } as RundownInterface)

            expect(() => testee.getPartAfter(part)).toThrow(LastPartInRundownException)
          })
        })
      })
    })
  })

  describe(Rundown.prototype.activate.name, () => {
    describe('Rundown is already active', () => {
      it('throws AlreadyActivatedException', () => {
        const testee: Rundown = new Rundown({ mode: RundownMode.ACTIVE } as RundownInterface)
        expect(() => testee.activate()).toThrow(AlreadyActivatedException)
      })
    })

    it('sets the Rundown to be active', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      expect(testee.isActive()).toBeFalsy()
      testee.activate()
      expect(testee.isActive()).toBeTruthy()
    })

    describe('Rundown is in Rehearsal', () => {
      it ('sets the Rundown to be active', () => {
        const testee: Rundown = new Rundown({ mode: RundownMode.REHEARSAL } as RundownInterface)
        testee.activate()
        expect(testee.getMode()).toBe(RundownMode.ACTIVE)
      })

      it('has same state as before activation', () => {
        const activePart: Part = EntityTestFactory.createPart({ id: 'activePart' })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'activeSegment', parts: [activePart] })

        const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'nextSegment', parts: [nextPart] })

        const infinitePiece: Piece = EntityTestFactory.createPiece({ pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END })
        const thirdPart: Part = EntityTestFactory.createPart({ id: 'thirdPart', pieces: [infinitePiece] })
        const thirdSegment: Segment = EntityTestFactory.createSegment({ id: 'thirdSegment', parts: [thirdPart] })

        const infinitePieces: Map<string, Piece> = new Map([
          ['layerOne', EntityTestFactory.createPiece({ id: 'infinitePieceOne' })],
          ['layerTwo', EntityTestFactory.createPiece({ id: 'infinitePieceTwo' })]
        ])
        const testee: Rundown = new Rundown({
          mode: RundownMode.REHEARSAL,
          segments: [activeSegment, nextSegment, thirdSegment],
          alreadyActiveProperties: {
            activeCursor: {
              part: activePart,
              segment: activeSegment,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              part: nextPart,
              segment: nextSegment,
              owner: Owner.SYSTEM
            },
            infinitePieces
          }
        } as RundownInterface)

        const historyBefore: Part[] = testee.getHistory()

        testee.activate()

        expect(testee.getActivePart()).toBe(activePart)
        expect(testee.getActiveSegment()).toBe(activeSegment)
        expect(testee.getNextPart()).toBe(nextPart)
        expect(testee.getNextSegment()).toBe(nextSegment)
        expect(testee.getInfinitePieces().length).toBe(infinitePieces.size)
        expect(testee.getHistory()).toBe(historyBefore)
      })
    })

    describe('first Segment is hidden', () => {
      it('sets the second Segment as the first Segment', () => {
        const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [EntityMockFactory.createPart()], isHidden: true })
        const secondSegment: Segment = EntityMockFactory.createSegment({ id: 'second', rank: 2, parts: [EntityMockFactory.createPart()] })
        const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

        const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, secondSegment, lastSegment] } as RundownInterface)
        testee.activate()
        expect(testee.getNextSegment()).toEqual(secondSegment)
      })
    })

    describe('first Segment has no Parts', () => {
      it('it sets the second Segment as the first of the Rundown', () => {
        const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [] })
        const secondSegment: Segment = EntityMockFactory.createSegment({ id: 'second', rank: 2, parts: [EntityMockFactory.createPart()] })
        const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

        const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, secondSegment, lastSegment] } as RundownInterface)
        testee.activate()
        expect(testee.getNextSegment()).toEqual(secondSegment)
      })
    })

    it('sets the first Segment to be the first Segment of the Rundown', () => {
      const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [EntityMockFactory.createPart()] })
      const middleSegment: Segment = EntityMockFactory.createSegment({ id: 'middle', rank: 2, parts: [EntityMockFactory.createPart()] })
      const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, middleSegment, lastSegment] } as RundownInterface)
      testee.activate()
      expect(testee.getNextSegment()).toEqual(firstSegment)
    })

    it('sets the first Part of the Segment to be the first Part of the first Segment', () => {
      const firstPart: Part = EntityMockFactory.createPart({ id: 'first' })
      const lastPart: Part = EntityMockFactory.createPart({ id: 'last' })
      const segment: Segment = new Segment({ parts: [firstPart, lastPart] } as SegmentInterface)

      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)
      testee.activate()
      expect(testee.getNextPart()).toEqual(firstPart)
    })

    it('does not set active Part', () => {
      const part: Part = EntityMockFactory.createPart()
      const segment: Segment = new Segment({ parts: [part] } as SegmentInterface)
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.activate()

      expect(() => testee.getActivePart()).toThrow()
    })

    it('does not set active Segment', () => {
      const part: Part = EntityMockFactory.createPart()
      const segment: Segment = new Segment({ parts: [part] } as SegmentInterface)
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.activate()

      expect(() => testee.getActiveSegment()).toThrow()
    })

    it('resets all segments', () => {
      const mockedSegment1: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })
      const mockedSegment2: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })
      const mockedSegment3: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })

      const segments: Segment[] = [
        instance(mockedSegment1),
        instance(mockedSegment2),
        instance(mockedSegment3),
      ]

      const testee: Rundown = new Rundown({
        segments,
        mode: RundownMode.INACTIVE,
      } as RundownInterface)

      testee.activate()

      verify(mockedSegment1.reset()).once()
      verify(mockedSegment2.reset()).once()
      verify(mockedSegment3.reset()).once()
    })

    it('resets the history to an empty array', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const history: Part[] = [
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart()
      ]

      const testee: Rundown = new Rundown({ history, segments: [segment] } as RundownInterface)

      expect(testee.getHistory()).toHaveLength(history.length)

      testee.activate()

      expect(testee.getHistory()).toHaveLength(0)
    })
  })

  describe(Rundown.prototype.enterRehearsal.name, () => {
    describe('Rundown is already active', () => {
      it('throws AlreadyActivatedException', () => {
        const testee: Rundown = new Rundown({ mode: RundownMode.ACTIVE } as RundownInterface)
        expect(() => testee.enterRehearsal()).toThrow(AlreadyActivatedException)
      })
    })

    describe('Rundown is already rehearsal', () => {
      it('throws AlreadyRehearsalException', () => {
        const testee: Rundown = new Rundown({ mode: RundownMode.REHEARSAL } as RundownInterface)
        expect(() => testee.enterRehearsal()).toThrow(AlreadyRehearsalException)
      })
    })

    it('sets the Rundown to be rehearsal', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.enterRehearsal()
      expect(testee.getMode()).toBe(RundownMode.REHEARSAL)
    })

    describe('first Segment is hidden', () => {
      it('sets the second Segment as the first Segment', () => {
        const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [EntityMockFactory.createPart()], isHidden: true })
        const secondSegment: Segment = EntityMockFactory.createSegment({ id: 'second', rank: 2, parts: [EntityMockFactory.createPart()] })
        const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

        const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, secondSegment, lastSegment] } as RundownInterface)
        testee.enterRehearsal()
        expect(testee.getNextSegment()).toEqual(secondSegment)
      })
    })

    describe('first Segment has no Parts', () => {
      it('it sets the second Segment as the first of the Rundown', () => {
        const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [] })
        const secondSegment: Segment = EntityMockFactory.createSegment({ id: 'second', rank: 2, parts: [EntityMockFactory.createPart()] })
        const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

        const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, secondSegment, lastSegment] } as RundownInterface)
        testee.enterRehearsal()
        expect(testee.getNextSegment()).toEqual(secondSegment)
      })
    })

    it('sets the first Segment to be the first Segment of the Rundown', () => {
      const firstSegment: Segment = EntityMockFactory.createSegment({ id: 'first', rank: 1, parts: [EntityMockFactory.createPart()] })
      const middleSegment: Segment = EntityMockFactory.createSegment({ id: 'middle', rank: 2, parts: [EntityMockFactory.createPart()] })
      const lastSegment: Segment = EntityMockFactory.createSegment({ id: 'last', rank: 3, parts: [EntityMockFactory.createPart()] })

      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [firstSegment, middleSegment, lastSegment] } as RundownInterface)
      testee.enterRehearsal()
      expect(testee.getNextSegment()).toEqual(firstSegment)
    })

    it('sets the first Part of the Segment to be the first Part of the first Segment', () => {
      const firstPart: Part = EntityMockFactory.createPart({ id: 'first' })
      const lastPart: Part = EntityMockFactory.createPart({ id: 'last' })
      const segment: Segment = new Segment({ parts: [firstPart, lastPart] } as SegmentInterface)

      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)
      testee.enterRehearsal()
      expect(testee.getNextPart()).toEqual(firstPart)
    })

    it('does not set active Part', () => {
      const part: Part = EntityMockFactory.createPart()
      const segment: Segment = new Segment({ parts: [part] } as SegmentInterface)
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.enterRehearsal()

      expect(() => testee.getActivePart()).toThrow()
    })

    it('does not set active Segment', () => {
      const part: Part = EntityMockFactory.createPart()
      const segment: Segment = new Segment({ parts: [part] } as SegmentInterface)
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.enterRehearsal()

      expect(() => testee.getActiveSegment()).toThrow()
    })

    it('resets all segments', () => {
      const mockedSegment1: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })
      const mockedSegment2: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })
      const mockedSegment3: Segment = EntityMockFactory.createSegmentMock({ parts: [EntityMockFactory.createPart()] })

      const segments: Segment[] = [
        instance(mockedSegment1),
        instance(mockedSegment2),
        instance(mockedSegment3),
      ]

      const testee: Rundown = new Rundown({
        segments,
        mode: RundownMode.INACTIVE,
      } as RundownInterface)

      testee.enterRehearsal()

      verify(mockedSegment1.reset()).once()
      verify(mockedSegment2.reset()).once()
      verify(mockedSegment3.reset()).once()
    })

    it('resets the history to an empty array', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const history: Part[] = [
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart()
      ]

      const testee: Rundown = new Rundown({ history, segments: [segment] } as RundownInterface)

      expect(testee.getHistory()).toHaveLength(history.length)

      testee.enterRehearsal()

      expect(testee.getHistory()).toHaveLength(0)
    })
  })

  describe(Rundown.prototype.addSegment.name, () => {
    describe('Segment already exist in Rundown', () => {
      it('throws already found exception', () => {
        const existingSegment: Segment = EntityTestFactory.createSegment()
        const testee: Rundown = new Rundown({ segments: [existingSegment] } as RundownInterface)

        expect(() => testee.addSegment(existingSegment)).toThrow(AlreadyExistException)
      })
    })

    describe('Segment does not exist in Rundown', () => {
      it('adds the Segment', () => {
        const segment: Segment = EntityTestFactory.createSegment()
        const testee: Rundown = new Rundown({ } as RundownInterface)

        expect(testee.getSegments()).not.toContain(segment)
        testee.addSegment(segment)
        expect(testee.getSegments()).toContain(segment)
      })

      it('sorts the Segment according to rank', () => {
        const segmentOne: Segment = EntityTestFactory.createSegment({ id: '1', rank: 1 })
        const segmentTwo: Segment = EntityTestFactory.createSegment({ id: '2', rank: 10 })

        const segmentToAdd: Segment = EntityTestFactory.createSegment({ id: 'toAdd', rank: 5 })

        const testee: Rundown = new Rundown({ segments: [segmentOne, segmentTwo] } as RundownInterface)

        testee.addSegment(segmentToAdd)

        expect(testee.getSegments()[0]).toBe(segmentOne)
        expect(testee.getSegments()[1]).toBe(segmentToAdd)
        expect(testee.getSegments()[2]).toBe(segmentTwo)
      })
    })

    // This describe block is to the test functionality of how to update the next cursor. It's a private method so we are using 'addSegment()'
    describe('it updates the next cursor', () => {
      describe('the Rundown is not active', () => {
        it('does not update the Next cursor', () => {
          const segmentToAdd: Segment = EntityTestFactory.createSegment()
          const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE } as RundownInterface)

          const nextCursorBefore: RundownCursor | undefined = testee.getNextCursor()
          testee.addSegment(segmentToAdd)
          const nextCursorAfter: RundownCursor | undefined = testee.getNextCursor()

          expect(nextCursorBefore).toBe(nextCursorAfter)
        })
      })

      describe('the Rundown is active', () => {
        it('update the next cursor when the "Owner" is not "External"', () => {
          const segmentToAdd: Segment = EntityTestFactory.createSegment({ id: 'toAdd' })

          const testee: Rundown = createTesteeWithActiveAndNextCursors({ nextOwner: Owner.SYSTEM })
          const nextCursorBefore: RundownCursor | undefined = testee.getNextCursor()

          testee.addSegment(segmentToAdd)

          expect(testee.getNextCursor()).not.toBe(nextCursorBefore)
        })

        it('updates the next cursor when current next cursor points to a non existing Segment in the Rundown', () => {
          const segmentToAdd: Segment = EntityTestFactory.createSegment({ id: 'toAdd' })
          const nonExistingSegment: Segment = EntityTestFactory.createSegment({ id: 'nonExistingSegment' })

          const testee: Rundown = createTesteeWithActiveAndNextCursors({ nextSegment: nonExistingSegment })
          const nextCursorBefore: RundownCursor | undefined = testee.getNextCursor()

          testee.addSegment(segmentToAdd)

          expect(testee.getNextCursor()).not.toBe(nextCursorBefore)
        })

        it('updates the next cursor when the current next cursor points to a non existing Part in the Rundown', () => {
          const segmentToAdd: Segment = EntityTestFactory.createSegment({ id: 'toAdd' })
          const nonExistingPart: Part = EntityTestFactory.createPart({ id: 'nonExistingPart' })

          const testee: Rundown = createTesteeWithActiveAndNextCursors({ nextPart: nonExistingPart })
          const nextCursorBefore: RundownCursor | undefined = testee.getNextCursor()

          testee.addSegment(segmentToAdd)

          expect(testee.getNextCursor()).not.toBe(nextCursorBefore)
        })

        it('does not update the next Cursor when the "Owner" is "External and the next cursor is pointing at a Segment and Part that exist in the Rundown', () => {
          const segmentToAdd: Segment = EntityTestFactory.createSegment({ id: 'toAdd' })

          // This relies on the default values of "createTesteeWithActiveAndNextCursors" being set correctly.
          const testee: Rundown = createTesteeWithActiveAndNextCursors( )
          const nextCursorBefore: RundownCursor | undefined = testee.getNextCursor()

          testee.addSegment(segmentToAdd)

          expect(testee.getNextCursor()).toBe(nextCursorBefore)
        })
      })
    })
  })

  describe(Rundown.prototype.updateSegment.name, () => {
    describe('Segment does not belong to Rundown', () => {
      it('throws NotFound exception', () => {
        const nonExistingSegment: Segment = EntityTestFactory.createSegment({ id: 'nonExistingSegment' })
        const testee: Rundown = new Rundown({} as RundownInterface)

        expect(() => testee.updateSegment(nonExistingSegment)).toThrow(NotFoundException)
      })
    })

    describe('Segment belongs to Rundown', () => {
      it('updates the old Segment', () => {
        const segmentId: string = 'segmentId'
        const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId })
        const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId })

        const testee: Rundown = new Rundown({ segments: [oldSegment] } as RundownInterface)

        expect(testee.getSegments()).toContain(oldSegment)
        expect(testee.getSegments()).not.toContain(newSegment)

        testee.updateSegment(newSegment)

        expect(testee.getSegments()).not.toContain(oldSegment)
        expect(testee.getSegments()).toContain(newSegment)
      })

      it('sorts the Segments according to rank', () => {
        const segmentId: string = 'segmentId'
        const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, rank: 1})
        const segmentTwo: Segment = EntityTestFactory.createSegment({ id: '2', rank: 5})
        const segmentThree: Segment = EntityTestFactory.createSegment({ id: '3', rank: 10})

        const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, rank: 15 })

        const testee: Rundown = new Rundown({ segments: [oldSegment, segmentTwo, segmentThree] } as RundownInterface)

        expect(testee.getSegments()[0]).toBe(oldSegment)
        expect(testee.getSegments()[1]).toBe(segmentTwo)
        expect(testee.getSegments()[2]).toBe(segmentThree)

        testee.updateSegment(newSegment)

        expect(testee.getSegments()[0]).toBe(segmentTwo)
        expect(testee.getSegments()[1]).toBe(segmentThree)
        expect(testee.getSegments()[2]).toBe(newSegment)
      })

      describe('the old Segment is on Air', () => {
        it('takes the Parts of the old Segment and gives them to the new Segment', () => {
          const segmentId: string = 'segmentId'
          const parts: Part[] = [
            EntityTestFactory.createPart({ id: 'partOne' }),
            EntityTestFactory.createPart({ id: 'partTwo' })
          ]
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, parts })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId })

          const testee: Rundown = new Rundown({ segments: [oldSegment] } as RundownInterface)

          expect(newSegment.getParts()).not.toBe(parts)
          testee.updateSegment(newSegment)
          expect(newSegment.getParts()).toBe(parts)
        })

        it('puts the new Segment on Air', () => {
          const segmentId: string = 'segmentId'
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: false })

          const testee: Rundown = new Rundown({ segments: [oldSegment] } as RundownInterface)

          expect(newSegment.isOnAir()).toBeFalsy()
          testee.updateSegment(newSegment)
          expect(newSegment.isOnAir()).toBeTruthy()
        })
      })

      // It should also update the next cursor, but those tests are covered by "addSegment()".
    })
  })

  describe(Rundown.prototype.removeSegment.name, () => {
    describe('Segment does not exist on Rundown', () => {
      it('does not delete anything', () => {
        const nonExistingSegmentId: string = 'nonExistingSegmentId'
        const existingSegment: Segment = EntityTestFactory.createSegment()
        const testee: Rundown = new Rundown({ segments: [existingSegment] } as RundownInterface)

        expect(testee.getSegments()).toHaveLength(1)
        testee.removeSegment(nonExistingSegmentId)
        expect(testee.getSegments()).toHaveLength(1)
      })
    })

    describe('Segment exist on Rundown', () => {
      it('removes the Segment from the Rundown', () => {
        const segment: Segment = EntityTestFactory.createSegment()
        const testee: Rundown = new Rundown({ segments: [segment] } as RundownInterface)

        expect(testee.getSegments()).toContain(segment)
        testee.removeSegment(segment.id)
        expect(testee.getSegments()).not.toContain(segment)
      })

      describe('Segment is on Air', () => {
        it('marks the Segment as unsynced', () => {
          const part: Part = EntityTestFactory.createPart({ isOnAir: true })
          const segment: Segment = EntityTestFactory.createSegment({ isOnAir: true, isUnsynced: false, parts: [part] })
          const testee: Rundown = new Rundown({ segments: [segment] } as RundownInterface)

          expect(segment.isUnsynced()).toBeFalsy()
          testee.removeSegment(segment.id)
          expect(segment.isUnsynced()).toBeTruthy()
        })

        describe('it gets an unsynced copy of the Segment', () => {
          describe('the unsynced Segment does not have a Part on Air', () => {
            it('throws a NotFound exception', () => {
              const segment: Segment = EntityTestFactory.createSegment({ isOnAir: true })
              const testee: Rundown = new Rundown({ segments: [segment] } as RundownInterface)

              expect(() => testee.removeSegment(segment.id)).toThrow(NotFoundException)
            })
          })

          it('sets the unsynced Segment and unsynced onAir Part as the active cursor', () => {
            const part: Part = EntityTestFactory.createPart({ isOnAir: true })
            const segment: Segment = EntityTestFactory.createSegment({ isOnAir: true, parts: [part] })

            const activeCursor: RundownCursor = {
              segment: EntityTestFactory.createSegment(),
              part: EntityTestFactory.createPart(),
              owner: Owner.SYSTEM
            }

            const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: { activeCursor } } as RundownInterface)

            expect(activeCursor).toBe(testee.getActiveCursor())
            testee.removeSegment(segment.id)
            expect(activeCursor).not.toBe(testee.getActiveCursor())
          })

          it('adds the unsynced Segment to the Segments array', () => {
            const part: Part = EntityTestFactory.createPart({ isOnAir: true })
            const segment: Segment = EntityTestFactory.createSegment({ isOnAir: true, parts: [part] })
            const testee: Rundown = new Rundown({ segments: [segment] } as RundownInterface)

            expect(testee.getSegments()).toHaveLength(1)
            expect(testee.getSegments()).toContain(segment)

            testee.removeSegment(segment.id)

            expect(testee.getSegments()).toHaveLength(1)
            expect(testee.getSegments()).not.toContain(segment)
            expect(testee.getSegments()[0].id).toContain(UNSYNCED_ID_POSTFIX)
          })

          it('sorts the Segments according to ranks', () => {
            const part: Part = EntityTestFactory.createPart({ isOnAir: true })
            const segmentToDelete: Segment = EntityTestFactory.createSegment({ isOnAir: true, parts: [part], rank: 1 })
            const segmentTwo: Segment = EntityTestFactory.createSegment({ id: '2', rank: 5 })
            const segmentThree: Segment = EntityTestFactory.createSegment({ id: '3', rank: 10 })

            const testee: Rundown = new Rundown({ segments: [segmentToDelete, segmentTwo, segmentThree] } as RundownInterface)

            expect(testee.getSegments()[0]).toBe(segmentToDelete)
            expect(testee.getSegments()[1]).toBe(segmentTwo)
            expect(testee.getSegments()[2]).toBe(segmentThree)

            testee.removeSegment(segmentToDelete.id)

            expect(testee.getSegments()[0].id).toContain(UNSYNCED_ID_POSTFIX)
            expect(testee.getSegments()[1]).toBe(segmentTwo)
            expect(testee.getSegments()[2]).toBe(segmentThree)
          })
        })
      })
    })

    // It should also update the NextCursor, but that is being tested by "addSegment()".
  })

  describe(Rundown.prototype.addPart.name, () => {
    describe('Part does not have a Segment id for any Segments in the Rundown', () => {
      it('throws a NotFound exception', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId: 'nonExistingSegmentId' })
        const testee: Rundown = new Rundown({} as RundownInterface)

        expect(() => testee.addPart(part)).toThrow(NotFoundException)
      })
    })

    describe('Part does have a Segment id for a Segment in the Rundown', () => {
      it('adds the Part to the Segment', () => {
        const segmentId: string = 'segmentId'
        const segment: Segment = EntityMockFactory.createSegmentMock({ id: segmentId })
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId })
        const testee: Rundown = new Rundown({ segments: [instance(segment)] } as RundownInterface)

        when(segment.id).thenReturn(segmentId)

        testee.addPart(part)

        const [partThatWasAdded] = capture(segment.addPart).last()
        expect(partThatWasAdded).toBe(part)
      })

      // It should also update the NextCursor, but that is being tested by "addSegment()".
    })
  })

  describe(Rundown.prototype.updatePart.name, () => {
    describe('Part does not have a Segment id for any Segments in the Rundown', () => {
      it('throws a NotFound exception', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId: 'nonExistingSegmentId' })
        const testee: Rundown = new Rundown({} as RundownInterface)

        expect(() => testee.updatePart(part)).toThrow(NotFoundException)
      })
    })

    describe('Part does have a Segment id for a Segment in the Rundown', () => {
      it('adds the Part to the Segment', () => {
        const segmentId: string = 'segmentId'
        const segment: Segment = EntityMockFactory.createSegmentMock({ id: segmentId })
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId })
        const testee: Rundown = new Rundown({ segments: [instance(segment)] } as RundownInterface)

        when(segment.id).thenReturn(segmentId)

        testee.updatePart(part)

        const [partThatWasUpdated] = capture(segment.updatePart).last()
        expect(partThatWasUpdated).toBe(part)
      })

      // It should also update the NextCursor, but that is being tested by "addSegment()".
    })
  })

  describe(Rundown.prototype.removePartFromSegment.name, () => {
    describe('PartId does not belong to any Parts in the Rundown', () => {
      it('throws not found exception', () => {
        const partId: string = 'partId'
        const testee: Rundown = new Rundown({} as RundownInterface)

        expect(() => testee.removePartFromSegment(partId)).toThrow(NotFoundException)
      })
    })

    describe('PartId does belong to a Part in the Rundown', () => {
      it('calls removePart on Segment', () => {
        const segmentId: string = 'segmentId'
        const segment: Segment = EntityMockFactory.createSegmentMock({ id: segmentId })
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId })
        const testee: Rundown = new Rundown({ segments: [instance(segment)] } as RundownInterface)

        when(segment.id).thenReturn(segmentId)
        when(segment.getParts()).thenReturn([part])

        testee.removePartFromSegment(part.id)

        const [partIdToBeRemoved] = capture(segment.removePart).last()
        expect(partIdToBeRemoved).toBe(part.id)
      })

      // It should also update the NextCursor, but that is being tested by "addSegment()".
    })

    describe('Rundown has an Infinite Piece belonging to the PartId', () => {
      it('marks the Infinite Piece as unsynced', () => {
        const partId: string = 'somePartId'
        const infinitePiece: Piece = EntityMockFactory.createPieceMock({
          id: 'somePieceId',
          partId,
          pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          layer: 'someLayer'
        })
        when(infinitePiece.getUnsyncedCopy()).thenReturn(infinitePiece)

        const infinitePieceMap: Map<string, Piece> = new Map()
        infinitePieceMap.set(infinitePiece.layer, instance(infinitePiece))


        const part: Part = EntityTestFactory.createPart({ id: partId })
        const segment: Segment = EntityTestFactory.createSegment({ parts: [part] })

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            infinitePieces: infinitePieceMap
          },
          segments: [segment]
        } as RundownInterface)

        testee.removePartFromSegment(partId)

        verify(infinitePiece.markAsUnsynced()).once()
      })

      it('updates the Infinite Piece to be the unsynced copy', () => {
        const partId: string = 'somePartId'
        const infinitePiece: Piece = EntityTestFactory.createPiece({
          id: 'somePieceId',
          partId,
          pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          layer: 'someLayer'
        })

        const infinitePieceMap: Map<string, Piece> = new Map()
        infinitePieceMap.set(infinitePiece.layer, infinitePiece)


        const part: Part = EntityTestFactory.createPart({ id: partId })
        const segment: Segment = EntityTestFactory.createSegment({ parts: [part] })

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            infinitePieces: infinitePieceMap
          },
          segments: [segment]
        } as RundownInterface)

        testee.removePartFromSegment(partId)

        const unsyncedInfinitePiece: Piece = testee.getInfinitePieces()[0]
        expect(unsyncedInfinitePiece).not.toBe(infinitePiece)
        expect(unsyncedInfinitePiece.id).toContain(UNSYNCED_ID_POSTFIX)
      })
    })
  })

  describe(Rundown.prototype.setNext.name, () => {
    it('resets next part right before changing next cursor', () => {
      const mockedNextPart: Part = EntityMockFactory.createPartMock({ isNext: true })
      const nextPart: Part = instance(mockedNextPart)
      const nextSegment: Segment = EntityMockFactory.createSegment({ id: 'next-segment-id', isNext: true, parts: [nextPart] })
      const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
      const otherPartInActiveSegment: Part = EntityMockFactory.createPart({ id: 'other-part-in-active-segment-id' })
      const mockedActiveSegment: Segment = EntityMockFactory.createSegmentMock({ id: 'active-segment-id', isOnAir: true, parts: [activePart, otherPartInActiveSegment] })
      when(mockedActiveSegment.findPart(otherPartInActiveSegment.id)).thenReturn(otherPartInActiveSegment)
      const activeSegment: Segment = instance(mockedActiveSegment)
      const testee: Rundown = new Rundown({
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            part: activePart,
            segment: activeSegment,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            part: instance(mockedNextPart),
            segment: nextSegment,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map(),
        },
        segments: [
          activeSegment,
          nextSegment,
        ],
      } as RundownInterface)

      testee.setNext(activeSegment.id, otherPartInActiveSegment.id)

      verify(mockedNextPart.reset()).once()
    })

    describe('nextCursor.Part is the same Part as the onAirCursor.Part OnAir', () => {
      it('does not reset the OnAir Part', () => {
        const mockedActivePart: Part = EntityMockFactory.createPartMock({ id: 'active-part-id', isOnAir: true })
        const activePart: Part = instance(mockedActivePart)
        const otherPartInActiveSegment: Part = EntityMockFactory.createPart({ id: 'other-part-in-active-segment-id' })
        const mockedActiveSegment: Segment = EntityMockFactory.createSegmentMock({ id: 'active-segment-id', isOnAir: true, parts: [mockedActivePart, otherPartInActiveSegment] })
        when(mockedActiveSegment.findPart(otherPartInActiveSegment.id)).thenReturn(otherPartInActiveSegment)
        const activeSegment: Segment = instance(mockedActiveSegment)

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part: activePart,
              segment: activeSegment,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              part: activePart,
              segment: activeSegment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
          segments: [
            activeSegment
          ],
        } as RundownInterface)

        testee.setNext(activeSegment.id, otherPartInActiveSegment.id)

        verify(mockedActivePart.reset()).never()
      })
    })

    describe('when next part is on air', () => {
      it('throws an active part exception', () => {
        const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'active-segment-id', parts: [activePart] })
        const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', isNext: true })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'next-segment-id', isNext: true, parts: [nextPart]})
        const rundown: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              segment: activeSegment,
              part: activePart,
            },
            nextCursor: {
              segment: nextSegment,
              part: nextPart,
            },
            infinitePieces: new Map(),
          },
          segments: [
            activeSegment,
          ],
        } as RundownInterface)

        const result: () => void = () => rundown.setNext(activeSegment.id, activePart.id)

        expect(result).toThrow(OnAirException)
      })
    })
  })

  describe(Rundown.prototype.findPartInHistory.name, () => {
    describe('no Parts match the predicate', () => {
      it('throws NoPartInHistory Exception', () => {
        const history: Part[] = [
          EntityTestFactory.createPart({ id: 'randomIdOne' }),
          EntityTestFactory.createPart({ id: 'randomIdTwo' }),
        ]

        const noMatchingPartPredicate: (part: Part) => boolean = () => false

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          history,
          alreadyActiveProperties: {
            activeCursor: {
              segment: EntityTestFactory.createSegment(),
              part: EntityTestFactory.createPart(),
              owner: Owner.SYSTEM
            }
          }
        } as RundownInterface)

        expect(() => testee.findPartInHistory(noMatchingPartPredicate)).toThrow(NoPartInHistoryException)
      })
    })

    describe('the active Part matches the predicate', () => {
      it('returns a clone of the Active Part', () => {
        const activePart: Part = EntityTestFactory.createPart({ id: 'activePartId' })
        const history: Part[] = [
          EntityTestFactory.createPart({ id: 'randomIdOne' }),
          EntityTestFactory.createPart({ id: 'randomIdTwo' }),
        ]

        const predicate: (part: Part) => boolean = (part: Part) => part.id === activePart.id

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          history,
          alreadyActiveProperties: {
            activeCursor: {
              segment: EntityTestFactory.createSegment(),
              part: activePart,
              owner: Owner.SYSTEM
            }
          }
        } as RundownInterface)

        const result: Part = testee.findPartInHistory(predicate)

        expect(result).not.toBe(activePart) // This asserts is not the same Object reference i.e. it's a clone
        expect(result).toStrictEqual(activePart) // This asserts is still has the same values i.e. it has been cloned
      })
    })

    describe('both the Active Part and a Part in the history matches the predicate', () => {
      it('returns a clone of the Active Part', () => {
        const name: string = 'someNameToIdentifyTwoParts'
        const activePart: Part = EntityTestFactory.createPart({ id: 'activePartId', name })
        const history: Part[] = [
          EntityTestFactory.createPart({ id: 'randomIdOne', name }),
          EntityTestFactory.createPart({ id: 'randomIdTwo' }),
        ]

        const predicate: (part: Part) => boolean = (part: Part) => part.name === name

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          history,
          alreadyActiveProperties: {
            activeCursor: {
              segment: EntityTestFactory.createSegment(),
              part: activePart,
              owner: Owner.SYSTEM
            }
          }
        } as RundownInterface)

        const result: Part = testee.findPartInHistory(predicate)

        expect(result).not.toBe(activePart) // This asserts is not the same Object reference i.e. it's a clone
        expect(result).toStrictEqual(activePart) // This asserts is still has the same values i.e. it has been cloned
      })
    })

    describe('a history Part matches the predicate', () => {
      it('returns the history Part', () => {
        const historyPartToFind: Part = EntityTestFactory.createPart({ id: 'randomIdOne' })
        const history: Part[] = [
          historyPartToFind,
          EntityTestFactory.createPart({ id: 'randomIdTwo' }),
        ]

        const predicate: (part: Part) => boolean = (part: Part) => part.id === historyPartToFind.id

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          history,
          alreadyActiveProperties: {
            activeCursor: {
              segment: EntityTestFactory.createSegment(),
              part: EntityTestFactory.createPart(),
              owner: Owner.SYSTEM
            }
          }
        } as RundownInterface)

        const result: Part = testee.findPartInHistory(predicate)
        expect(result).toBe(historyPartToFind)
      })
    })

    describe('two history Parts matches the predicate', () => {
      it('returns the last inserted history Part', () => {
        const name: string = 'someNameToIdentifyMultipleParts'
        const firstPart: Part = EntityTestFactory.createPart({ id: 'randomIdOne', name })
        const lastPart: Part = EntityTestFactory.createPart({ id: 'randomIdTwo', name })
        const history: Part[] = [
          firstPart,
          lastPart,
        ]

        const predicate: (part: Part) => boolean = (part: Part) => part.name === name

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          history,
          alreadyActiveProperties: {
            activeCursor: {
              segment: EntityTestFactory.createSegment(),
              part: EntityTestFactory.createPart(),
              owner: Owner.SYSTEM
            }
          }
        } as RundownInterface)

        const result: Part = testee.findPartInHistory(predicate)
        expect(result).toBe(lastPart)
      })
    })
  })
})

function createTesteeWithActiveAndNextCursors(params?: {
  nextSegment?: Segment,
  nextPart?: Part,
  nextOwner?: Owner
}): Rundown {
  const existingActivePart: Part = EntityTestFactory.createPart({ id: 'existingActivePart' })
  const existingActiveSegment: Segment = EntityTestFactory.createSegment({ id: 'existingActiveSegment', parts: [existingActivePart] })

  const existingNextPart: Part = EntityTestFactory.createPart({ id: 'existingNextPart' })
  const existingNextSegment: Segment = EntityTestFactory.createSegment({ id: 'existingNextSegment', parts: [existingNextPart] })

  const activeCursor: RundownCursor = {
    segment: existingActiveSegment,
    part: existingActivePart,
    owner: Owner.SYSTEM
  }

  const nextCursor: RundownCursor = {
    segment: params?.nextSegment ?? existingNextSegment,
    part: params?.nextPart ?? existingNextPart,
    owner: params?.nextOwner ?? Owner.EXTERNAL
  }
  return new Rundown({
    mode: RundownMode.ACTIVE,
    alreadyActiveProperties: {
      activeCursor,
      nextCursor
    },
    segments: [existingActiveSegment, existingNextSegment]
  } as RundownInterface)
}
