import {Segment, SegmentInterface} from '../segment'
import {Rundown, RundownInterface} from '../rundown'
import {Part} from '../part'
import {Piece} from '../piece'
import {PieceLifespan} from '../../enums/piece-lifespan'
import {EntityMockFactory} from './entity-mock-factory'
import {capture, instance, mock, spy, verify, when} from '@typestrong/ts-mockito'
import {NotActivatedException} from '../../exceptions/not-activated-exception'
import {NotFoundException} from '../../exceptions/not-found-exception'
import {LastPartInSegmentException} from '../../exceptions/last-part-in-segment-exception'
import {LastPartInRundownException} from '../../exceptions/last-part-in-rundown-exception'
import {AlreadyActivatedException} from '../../exceptions/already-activated-exception'
import {Owner} from '../../enums/owner'
import {EntityTestFactory} from './entity-test-factory'
import {AlreadyExistException} from '../../exceptions/already-exist-exception'
import {RundownCursor} from '../../value-objects/rundown-cursor'
import {UNSYNCED_ID_POSTFIX} from '../../value-objects/unsynced_constants'
import {OnAirException} from '../../exceptions/on-air-exception'
import {NoPartInHistoryException} from '../../exceptions/no-part-in-history-exception'
import {RundownMode} from '../../enums/rundown-mode'
import {AlreadyRehearsalException} from '../../exceptions/already-rehearsal-exception'
import {InvalidSegmentException} from '../../exceptions/invalid-segment-exception'
import {Invalidity} from '../../value-objects/invalidity'
import {InvalidPartException} from '../../exceptions/invalid-part-exception'
import {PartTimings} from '../../value-objects/part-timings'

describe(Rundown.name, () => {
  describe('instantiate already active Rundown', () => {
    describe('"alreadyActiveProperties" is provided', () => {
      describe('when rundown is inactive', () => {
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

          const result: () => Rundown = () => new Rundown(rundownInterface)

          expect(result).toThrow()
        })
      })

      describe('when rundown is active', () => {
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

            const testee: Rundown = new Rundown(rundownInterface)

            expect(testee.getActivePart()).toBe(activePart)
            expect(testee.getNextPart()).toBe(nextPart)
            expect(testee.getActiveSegment()).toBe(activeSegment)
            expect(testee.getNextSegment()).toBe(nextSegment)
            expect(testee.getInfinitePieces()).toContain(piece)
          })

          it('marks the next Part as next', () => {
            const activePart: Part = EntityTestFactory.createPart({ id: 'activePart' })
            const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', isNext: false }) // Needs to be false, so we can verify it being set to true.
            const activeSegment: Segment = EntityTestFactory.createSegment({
              id: 'activeSegment',
            })
            const nextSegment: Segment = EntityTestFactory.createSegment({
              id: 'nextSegment',
            })
            const piece: Piece = EntityTestFactory.createPiece({
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

            expect(nextPart.isNext()).toBeFalsy()
            new Rundown(rundownInterface)
            expect(nextPart.isNext()).toBeTruthy()
          })
        })

        describe('when next part is invalid', () => {
          describe('when there are no valid parts after the on air part', () => {
            it ('sets the on air part as next', () => {
              const segmentId: string = 'segment-id'
              const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', segmentId, isOnAir: true })
              activePart.calculateTimings()
              const invalidity: Invalidity = { reason: 'some reason' }
              const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId, isNext: true, invalidity })
              const segment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, isNext: true, parts: [activePart, nextPart] })
              const testee: Rundown = EntityTestFactory.createRundown({
                mode: RundownMode.ACTIVE,
                alreadyActiveProperties: {
                  activeCursor: {
                    segment,
                    part: activePart,
                    owner: Owner.SYSTEM,
                  },
                  nextCursor: {
                    segment,
                    part: nextPart,
                    owner: Owner.SYSTEM,
                  },
                  infinitePieces: new Map(),
                },
                segments: [segment]
              })

              expect(testee.getNextCursor()?.segment).toBe(segment)
              expect(testee.getNextCursor()?.part).toBe(activePart)
            })
          })

          describe('when there is a valid part after the on air part', () => {
            it('sets the first valid part after the on air part as next', () => {
              const segmentId: string = 'segment-id'
              const activePart: Part = EntityTestFactory.createPart({ id: 'active-part-id', segmentId, isOnAir: true })
              activePart.calculateTimings()
              const invalidity: Invalidity = { reason: 'some reason' }
              const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId, isNext: true, invalidity })
              const nextValidPart: Part = EntityTestFactory.createPart({ id: 'next-valid-part-id', segmentId })
              const segment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, isNext: true, parts: [activePart, nextPart, nextValidPart] })
              const testee: Rundown = EntityTestFactory.createRundown({
                mode: RundownMode.ACTIVE,
                alreadyActiveProperties: {
                  activeCursor: {
                    segment,
                    part: activePart,
                    owner: Owner.SYSTEM,
                  },
                  nextCursor: {
                    segment,
                    part: nextPart,
                    owner: Owner.SYSTEM,
                  },
                  infinitePieces: new Map(),
                },
                segments: [segment]
              })

              expect(testee.getNextCursor()?.segment).toBe(segment)
              expect(testee.getNextCursor()?.part).toBe(nextValidPart)
            })
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
          const activePart: Part = EntityTestFactory.createPart({id: 'activePartId', isOnAir: true})
          activePart.calculateTimings()
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId'})
          const segment: Segment = EntityTestFactory.createSegment({parts: [activePart, nextPart]})

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
          const activePart: Part = EntityTestFactory.createPart({id: 'activePartId', isOnAir: true})
          activePart.calculateTimings()
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId'})
          const segment: Segment = EntityTestFactory.createSegment({parts: [activePart, nextPart]})

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
            const onAirPart: Part = EntityTestFactory.createPart({
              id: 'onAirPartId', isOnAir: true, timings: {
                inTransitionStart: 0,
                delayStartOfPiecesDuration: 0,
                postRollDuration: 0,
                previousPartContinueIntoPartDuration: 0,
              }
            })
            const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId', isNext: true})
            const executedAtEpochTime: number = 1234
            const onAirAndNextSegment: Segment = EntityTestFactory.createSegment({
              id: 'onAirAndNextSegmentId',
              isOnAir: true,
              isNext: true,
              parts: [onAirPart, nextPart],
              executedAtEpochTime
            })

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
            const onAirPart: Part = EntityTestFactory.createPart({
              id: 'onAirPartId', isOnAir: true, timings: {
                inTransitionStart: 0,
                delayStartOfPiecesDuration: 0,
                postRollDuration: 0,
                previousPartContinueIntoPartDuration: 0,
              }
            })
            const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId', isNext: true})
            const executedAtEpochTime: number = 1234
            const onAirSegment: Segment = EntityTestFactory.createSegment({
              id: 'onAirSegmentId',
              isOnAir: true,
              parts: [onAirPart],
              executedAtEpochTime
            })
            const nextSegment: Segment = EntityTestFactory.createSegment({
              id: 'nextSegmentId',
              isNext: true,
              parts: [nextPart],
              executedAtEpochTime: undefined
            })

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
            const activePart: Part = EntityTestFactory.createPart({id: 'activePartId', isOnAir: true})
            activePart.calculateTimings()
            const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId'})
            const segment: Segment = EntityTestFactory.createSegment({parts: [activePart, nextPart]})

            const historyPartIdPrefix: string = 'partId_'

            const maximumHistoryEntries: number = 30 // Maximum entries is at the time of writing 30.
            const numberToExceedHistory: number = 5

            const history: Part[] = []
            for (let i = 0; i < maximumHistoryEntries + numberToExceedHistory; i++) {
              history.push(EntityTestFactory.createPart({id: `${historyPartIdPrefix}${i}`}))
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
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPartId'})
          const segment: Segment = EntityTestFactory.createSegment({parts: [nextPart]})

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
          const firstPiece: Piece = EntityTestFactory.createPiece({
            layer: 'someLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({pieces: [firstPiece]})
          const firstSegment: Segment = EntityTestFactory.createSegment({ id: 'firstSegment', parts: [firstPart] })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            layer: 'someOtherLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityTestFactory.createPart({pieces: [nextPiece]})
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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

          const firstPiece: Piece = EntityTestFactory.createPiece({
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({pieces: [firstPiece]})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const nextPart: Part = EntityTestFactory.createPart({pieces: [nextPiece]})
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart'})
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart'})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart, nextPart]
          })

          const middleSegment: Segment = EntityTestFactory.createSegment({
            id: 'middleSegment',
            parts: [EntityTestFactory.createPart()]
          })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [EntityTestFactory.createPart()]
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
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart'})
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart'})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart, nextPart]
          })

          const middleSegment: Segment = EntityTestFactory.createSegment({
            id: 'middleSegment',
            isHidden: true,
            parts: [EntityTestFactory.createPart()]
          })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [EntityTestFactory.createPart()]
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
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart'})
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart'})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart, nextPart]
          })

          const middleSegment: Segment = EntityTestFactory.createSegment({id: 'middleSegment', parts: []})
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [EntityTestFactory.createPart()]
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
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityTestFactory.createSegment({
            id: 'middleSegment',
            parts: [middlePart],
          })

          const lastPart: Part = EntityTestFactory.createPart({id: 'lastPart'})
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it jumps "back" up the Rundown and "skips" a Segment with a "sticky Rundown" infinite Piece', () => {
        it('does not change the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart'})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityTestFactory.createSegment({
            id: 'middleSegment',
            parts: [middlePart],
          })

          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const lastPart: Part = EntityTestFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Segment with a "sticky Rundown" infinite Piece for the same layer', () => {
        it('changes the "sticky" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const lastPart: Part = EntityTestFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Segment with a "spanning Rundown" infinite Piece', () => {
        it('changes to the "spanning" infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const lastPart: Part = EntityTestFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstSegmentId: string = 'first-segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId: firstSegmentId,
            isOnAir: true,
            pieces: [firstPiece],
          })
          firstPart.calculateTimings()
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: firstSegmentId,
            isOnAir: true,
            parts: [firstPart],
          })

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middle-piece-id',
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const middleSegmentId: string = 'middle-segment-id'
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId: middleSegmentId,
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityTestFactory.createSegment({ id: middleSegmentId, parts: [middlePart] })

          const lastSegmentId: string = 'last-segment-id'
          const lastPart: Part = EntityTestFactory.createPart({ id: 'last-part-id', segmentId: lastSegmentId, isNext: true })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: lastSegmentId,
            isNext: true,
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })

        it('sets executedAt on the taken infinite Piece', () => {
          const now: number = Date.now()
          jest.useFakeTimers().setSystemTime(now)

          const layer: string = 'someLayer'
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstSegmentId: string = 'first-segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId: firstSegmentId,
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: firstSegmentId,
            parts: [firstPart],
          })

          const middlePieceId: string = 'middle-piece-id'
          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: middlePieceId,
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const middleSegmentId: string = 'middle-segment-id'
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId: middleSegmentId,
            pieces: [middlePiece],
          })
          const middleSegment: Segment = EntityTestFactory.createSegment({ id: middleSegmentId, parts: [middlePart] })

          const lastSegmentId: string = 'last-segment-id'
          const lastPart: Part = EntityTestFactory.createPart({ id: 'last-part-id', segmentId: lastSegmentId })
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: lastSegmentId,
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece | undefined = testee.getPart(middlePartId)?.getPieces()
            .find(piece => piece.id === middlePieceId)
          expect(result?.getExecutedAt()).toBe(now)
        })
      })

      describe('it jumps "back" up the Rundown before the "spanning" infinite Piece', () => {
        describe('there is a previous "spanning" infinite Piece', () => {
          it('selects the previous "spanning" Piece', () => {
            const layer: string = 'someLayer'
            const firstPiece: Piece = EntityTestFactory.createPiece({
              id: 'firstPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const firstPart: Part = EntityTestFactory.createPart({
              id: 'firstPart',
              pieces: [firstPiece],
            })
            const firstSegment: Segment = EntityTestFactory.createSegment({id: 'firstSegment', parts: [firstPart]})

            const middlePart: Part = EntityTestFactory.createPart({id: 'middlePart'})
            const middleSegment: Segment = EntityTestFactory.createSegment({
              id: 'middleSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityTestFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const lastPart: Part = EntityTestFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })
            const lastSegment: Segment = EntityTestFactory.createSegment({
              id: 'lastSegment',
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(1)
            expect(result).toContainEqual(firstPiece)
          })
        })

        describe('there are no other "spanning" infinite Pieces', () => {
          it('has no longer any infinite Pieces', () => {
            const layer: string = 'someLayer'
            const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart'})
            const firstSegment: Segment = EntityTestFactory.createSegment({
              id: 'firstSegment',
              parts: [firstPart],
            })

            const middlePart: Part = EntityTestFactory.createPart({id: 'middlePart'})
            const middleSegment: Segment = EntityTestFactory.createSegment({
              id: 'middleSegment',
              parts: [middlePart],
            })

            const lastPiece: Piece = EntityTestFactory.createPiece({
              id: 'lastPiece',
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
            })
            const lastPart: Part = EntityTestFactory.createPart({
              id: 'lastPart',
              pieces: [lastPiece],
            })
            const lastSegment: Segment = EntityTestFactory.createSegment({
              id: 'lastSegment',
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(0)
          })
        })
      })

      describe('it takes a Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('takes the "stickyThenSpanning" Piece', () => {
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart', pieces: [firstPiece]})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const lastPart: Part = EntityTestFactory.createPart({id: 'lastPart', pieces: [lastPiece]})
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('"skips" a Segment with a "stickyThenSpanning infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart', pieces: [firstPiece]})
          const firstSegment: Segment = EntityTestFactory.createSegment({id: 'firstSegment', parts: [firstPart]})

          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityTestFactory.createPart({id: 'middlePart', pieces: [middlePiece]})
          const middleSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [middlePart],
          })

          const lastPart: Part = EntityTestFactory.createPart({id: 'lastPart'})
          const lastSegment: Segment = EntityTestFactory.createSegment({
            id: 'lastSegment',
            parts: [lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.WITHIN_PART,
          })
          const nextPart: Part = EntityTestFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const nextPart: Part = EntityTestFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: 'segment',
            parts: [firstPart, nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it "skips" a Part within the Segment that has a "sticky segment" infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const segmentId: string = 'segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId,
            pieces: [firstPiece],
          })

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middle-piece-id',
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId,
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityTestFactory.createPart({ id: 'last-part-id', segmentId })

          const segment: Segment = EntityTestFactory.createSegment({
            id: segmentId,
            parts: [firstPart, middlePart, lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it jumps "back" up the Segment before another "sticky segment" infinite Piece', () => {
        it('does not change infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPart: Part = EntityTestFactory.createPart({id: 'first-part-id'})

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middle-piece-id',
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const segmentId: string = 'segment-id'
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId,
            pieces: [middlePiece],
          })

          const lastPartId: string = 'last-part-id'
          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            partId: lastPartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const lastPart: Part = EntityTestFactory.createPart({
            id: lastPartId,
            segmentId,
            pieces: [lastPiece],
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: segmentId,
            parts: [firstPart, middlePart, lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(lastPiece)
        })
      })

      describe('it takes a Part within the Segment with a "spanning segment" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            id: 'nextPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const nextPart: Part = EntityTestFactory.createPart({
            id: 'nextPart',
            pieces: [nextPiece],
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: 'segment',
            parts: [firstPart, nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it takes a Part within segment with "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const segmentId: string = 'segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId,
            pieces: [firstPiece],
          })

          const nextPartId: string = 'next-part-id'
          const nextPiece: Piece = EntityTestFactory.createPiece({
            id: 'next-piece-id',
            partId: nextPartId,
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const nextPart: Part = EntityTestFactory.createPart({
            id: nextPartId,
            segmentId,
            pieces: [nextPiece],
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: segmentId,
            parts: [firstPart, nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(nextPiece)
        })
      })

      describe('it "skips" a Part within the Segment with "stickyThenSpanning" infinite Piece', () => {
        it('does not change the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const segmentId: string = 'segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId,
            pieces: [firstPiece],
          })

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId,
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityTestFactory.createPart({
            id: 'last-part-id',
            segmentId,
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: segmentId,
            parts: [firstPart, middlePart, lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContain(firstPiece)
        })
      })

      describe('it changes Segment', () => {
        it('no longer have any infinite Pieces', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart'})
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

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
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: 'middlePart',
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityTestFactory.createPart({ id: 'lastPart' })

          const segment: Segment = EntityTestFactory.createSegment({ id: 'segment', parts: [firstPart, middlePart, lastPart] })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })

        it('sets executedAt on taken infinite Piece', () => {
          const now: number = Date.now()
          jest.useFakeTimers().setSystemTime(now)

          const layer: string = 'someLayer'
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'first-piece-id',
            partId: firstPartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const segmentId: string = 'segment-id'
          const firstPart: Part = EntityTestFactory.createPart({
            id: firstPartId,
            segmentId,
            pieces: [firstPiece],
          })

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middle-piece-id',
            partId: middlePartId,
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const middlePart: Part = EntityTestFactory.createPart({
            id: middlePartId,
            segmentId,
            pieces: [middlePiece],
          })

          const lastPart: Part = EntityTestFactory.createPart({ id: 'last-part-id', segmentId })

          const segment: Segment = EntityTestFactory.createSegment({ id: segmentId, parts: [firstPart, middlePart, lastPart] })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece | undefined = testee
            .getSegments()[0].getParts()
            .find(part => part.id === middlePiece.getPartId())?.getPieces()
            .find(piece => piece.id === middlePiece.id)
          expect(result?.getExecutedAt()).toBe(now)
        })
      })

      describe('it jumps "back" up the Segment before the Part with the spanning Segment', () => {
        describe('there is a previous "spanning segment" infinite Piece', () => {
          it('changes to the previous "spanning" infinite Piece', () => {
            const layer: string = 'someLayer'
            const segmentId: string = 'segment-id'
            const firstPartId: string = 'first-part-id'
            const firstPiece: Piece = EntityTestFactory.createPiece({
              id: 'first-piece-id',
              partId: firstPartId,
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const firstPart: Part = EntityTestFactory.createPart({
              id: firstPartId,
              segmentId,
              pieces: [firstPiece],
            })

            const middlePart: Part = EntityTestFactory.createPart({ id: 'middle-part-id', segmentId })

            const lastPartId: string = 'last-part-id'
            const lastPiece: Piece = EntityMockFactory.createPiece({
              id: 'lastPiece',
              partId: lastPartId,
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const lastPart: Part = EntityTestFactory.createPart({
              id: lastPartId,
              segmentId,
              pieces: [lastPiece],
            })

            const segment: Segment = EntityTestFactory.createSegment({id: segmentId, parts: [firstPart, middlePart, lastPart]})

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(1)
            expect(result).toContainEqual(firstPiece)
          })
        })

        describe('there are no previous "spanning" infinite Pieces', () => {
          it('no longer have any infinite Pieces', () => {
            const layer: string = 'someLayer'
            const segmentId: string = 'segment-id'
            const firstPart: Part = EntityTestFactory.createPart({ id: 'first-part-id', segmentId })

            const middlePart: Part = EntityTestFactory.createPart({ id: 'middlePart', segmentId })

            const lastPartId: string = 'last-part-id'
            const lastPiece: Piece = EntityTestFactory.createPiece({
              id: 'lastPiece',
              partId: lastPartId,
              layer,
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const lastPart: Part = EntityTestFactory.createPart({
              id: lastPartId,
              segmentId,
              pieces: [lastPiece],
            })

            const segment: Segment = EntityTestFactory.createSegment({
              id: segmentId,
              parts: [firstPart, middlePart, lastPart],
            })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toHaveLength(0)
          })
        })
      })

      describe('it takes a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const lastPiece: Piece = EntityTestFactory.createPiece({
            id: 'lastPiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const lastPart: Part = EntityTestFactory.createPart({
            id: 'lastPart',
            pieces: [lastPiece],
          })

          const segment: Segment = EntityTestFactory.createSegment({
            id: 'segment',
            parts: [firstPart, lastPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(lastPiece)
        })
      })

      describe('it "skips" a Part within the Segment with a "stickyThenSpanning" infinite Piece', () => {
        it('changes the infinite Piece', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })

          const middlePiece: Piece = EntityTestFactory.createPiece({
            id: 'middlePiece',
            layer,
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const middlePart: Part = EntityTestFactory.createPart({id: 'middlePart', pieces: [middlePiece]})

          const lastPart: Part = EntityTestFactory.createPart({
            id: 'lastPart',
          })

          const segment: Segment = EntityTestFactory.createSegment({id: 'segment', parts: [firstPart, middlePart, lastPart]})

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(1)
          expect(result).toContainEqual(middlePiece)
        })
      })

      describe('it changes Segment', () => {
        it('no longer have any infinite Pieces', () => {
          const layer: string = 'someLayer'
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            layer,
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const firstPart: Part = EntityTestFactory.createPart({
            id: 'firstPart',
            pieces: [firstPiece],
          })
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart'})
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'nextSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toHaveLength(0)
        })
      })
    })

    describe('Rundown has a "stickyThenSpanning" infinite Piece', () => {
      describe('it takes another Segment with a "spanningThenSticky" infinite Piece', () => {
        it('changes infinite Piece', () => {
          const firstPiece: Piece = EntityTestFactory.createPiece({
            id: 'firstPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const firstPart: Part = EntityTestFactory.createPart({id: 'firstPart', pieces: [firstPiece]})
          const firstSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [firstPart],
          })

          const nextPiece: Piece = EntityTestFactory.createPiece({
            id: 'nextPiece',
            pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
          })
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart', pieces: [nextPiece]})
          const nextSegment: Segment = EntityTestFactory.createSegment({
            id: 'firstSegment',
            parts: [nextPart],
          })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toContainEqual(nextPiece)
        })
      })

      describe('it "skips" a Segment with a "spanningThenSticky" infinite Piece', () => {
        it('does not change the infinite Piece', () => {
          const firstPartId: string = 'first-part-id'
          const firstPiece: Piece = EntityTestFactory.createPiece({ id: 'first-piece-id', partId: firstPartId, pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN })
          const firstSegmentId: string = 'first-segment-id'
          const firstPart: Part = EntityTestFactory.createPart({ id: firstPartId, segmentId: firstSegmentId, pieces: [firstPiece] })
          const firstSegment: Segment = EntityTestFactory.createSegment({ id: firstSegmentId,  parts: [firstPart] })

          const middlePartId: string = 'middle-part-id'
          const middlePiece: Piece = EntityTestFactory.createPiece({ id: 'middle-piece-id', partId: middlePartId, pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN })
          const middleSegmentId: string = 'middle-segment-id'
          const middlePart: Part = EntityTestFactory.createPart({ id: middlePartId, segmentId: middleSegmentId, pieces: [middlePiece] })
          const middleSegment: Segment = EntityTestFactory.createSegment({ id: middleSegmentId, parts: [middlePart] })

          const lastSegmentId: string = 'last-segment-id'
          const lastPart: Part = EntityTestFactory.createPart({ id: 'last-part-id', segmentId: lastSegmentId })
          const lastSegment: Segment = EntityTestFactory.createSegment({ id: lastSegmentId,  parts: [lastPart] })

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
          }))

          testee.takeNext()

          const result: Piece[] = testee.getInfinitePieces()
          expect(result).toContainEqual(firstPiece)
        })
      })

      describe('when a part, located earlier in the rundown than the part that defines the "spanning-then-sticky" infinite piece, is put on air', () => {
        describe('when a "spanning-then-sticky" infinite piece is defined earlier than the new on air part', () => {
          it('keeps the first "spanning-then-sticky" piece', () => {
            const firstPartId: string = 'first-part-id'
            const firstPiece: Piece = EntityTestFactory.createPiece({
              id: 'first-piece-id',
              partId: firstPartId,
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const firstSegmentId: string = 'first-segment-id'
            const firstPart: Part = EntityTestFactory.createPart({ id: firstPartId, segmentId: firstSegmentId, pieces: [firstPiece] })
            const firstSegment: Segment = EntityTestFactory.createSegment({ id: firstSegmentId, parts: [firstPart] })

            const middleSegmentId: string = 'middle-segment-id'
            const middlePart: Part = EntityTestFactory.createPart({ id: 'middle-part-id', segmentId: middleSegmentId, isNext: true })
            const middleSegment: Segment = EntityTestFactory.createSegment({ id: middleSegmentId, isNext: true, parts: [middlePart] })

            const lastPartId: string = 'last-part-id'
            const lastPiece: Piece = EntityTestFactory.createPiece({
              id: 'last-piece-id',
              partId: lastPartId,
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const lastSegmentId: string = 'last-segment-id'
            const lastPart: Part = EntityTestFactory.createPart({id: lastPartId, segmentId: lastSegmentId, isOnAir: true, pieces: [lastPiece]})
            lastPart.calculateTimings()
            const lastSegment: Segment = EntityTestFactory.createSegment({ id: lastSegmentId, isOnAir: true, parts: [lastPart] })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

            testee.takeNext()

            const result: Piece[] = testee.getInfinitePieces()
            expect(result).toContainEqual(lastPiece)
          })
        })

        describe('when no "spanning-then-sticky" infinite pieces are defined before the new on air part', () => {
          it('keeps the first "spanningThenSticky" Piece', () => {
            const firstSegmentId: string = 'first-segment-id'
            const firstPart: Part = EntityMockFactory.createPart({ id: 'first-part-id', segmentId: firstSegmentId })
            const firstSegment: Segment = EntityMockFactory.createSegment({
              id: firstSegmentId,
              parts: [firstPart],
            })

            const middleSegmentId: string = 'middle-segment-id'
            const middlePart: Part = EntityTestFactory.createPart({ id: 'middle-part-id', segmentId: middleSegmentId, isNext: true })
            const middleSegment: Segment = EntityTestFactory.createSegment({
              id: middleSegmentId,
              isNext: true,
              parts: [middlePart],
            })

            const lastPartId: string = 'last-part-id'
            const lastPiece: Piece = EntityTestFactory.createPiece({
              id: 'last-piece-id',
              partId: lastPartId,
              pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN,
            })
            const lastSegmentId: string = 'last-segment-id'
            const lastPart: Part = EntityTestFactory.createPart({id: lastPartId, segmentId: lastSegmentId, isOnAir: true, pieces: [lastPiece]})
            lastPart.calculateTimings()
            const lastSegment: Segment = EntityTestFactory.createSegment({
              id: lastSegmentId,
              isOnAir: true,
              parts: [lastPart],
            })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
            }))

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
          const partNotInAnySegments: Part = EntityTestFactory.createPart({
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

    it('sets an empty rundown to be active', () => {
      const testee: Rundown = EntityTestFactory.createRundown({id: 'emptyRundown', mode: RundownMode.INACTIVE})

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
  })

  describe(Rundown.prototype.deactivate.name, () => {
    it('resets all Segments', () => {
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
        mode: RundownMode.ACTIVE,
      } as RundownInterface)

      testee.deactivate()

      verify(mockedSegment1.reset()).once()
      verify(mockedSegment2.reset()).once()
      verify(mockedSegment3.reset()).once()
    })

    it('removes unsynced segments', () => {
      const onAirSegmentId: string = 'on-air-segment-id'
      const onAirPart: Part = EntityTestFactory.createPart({ segmentId: onAirSegmentId, isOnAir: true })
      const unsyncedOnAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, isUnsynced: true, isOnAir: true, parts: [onAirPart] })

      const nextSegmentId: string = 'next-segment-id'
      const nextPart: Part = EntityTestFactory.createPart({ segmentId: nextSegmentId, isNext: true })
      const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

      const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            part: onAirPart,
            segment: unsyncedOnAirSegment,
            owner: Owner.SYSTEM,
          },
          nextCursor: {
            part: nextPart,
            segment: nextSegment,
            owner: Owner.SYSTEM,
          },
          infinitePieces: new Map(),
        },
        segments: [unsyncedOnAirSegment, nextSegment]
      }))

      testee.deactivate()

      expect(testee.getSegments().length).toBe(1)
      expect(testee.getSegments()).toEqual(expect.arrayContaining([expect.objectContaining({ id: nextSegmentId })]))
    })

    it('removes unsynced parts', () => {
      const onAirSegmentId: string = 'on-air-segment-id'
      const unsyncedOnAirPart: Part = EntityTestFactory.createPart({ segmentId: onAirSegmentId, isOnAir: true, isUnsynced: true })
      const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, isOnAir: true, parts: [unsyncedOnAirPart] })

      const nextSegmentId: string = 'next-segment-id'
      const nextPart: Part = EntityTestFactory.createPart({ segmentId: nextSegmentId, isNext: true })
      const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

      const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            part: unsyncedOnAirPart,
            segment: onAirSegment,
            owner: Owner.SYSTEM,
          },
          nextCursor: {
            part: nextPart,
            segment: nextSegment,
            owner: Owner.SYSTEM,
          },
          infinitePieces: new Map(),
        },
        segments: [onAirSegment, nextSegment]
      }))

      testee.deactivate()

      expect(testee.getSegments().length).toBe(2)
      expect(testee.getSegments()).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: nextSegmentId }),
        expect.objectContaining({ id: onAirSegmentId, parts: expect.not.arrayContaining([expect.objectContaining({ id: unsyncedOnAirPart.id })]) }),
      ]))
    })

    it('resets history to an empty array', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const history: Part[] = [
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart(),
        EntityTestFactory.createPart()
      ]

      const testee: Rundown = new Rundown({ history, segments: [segment], mode: RundownMode.ACTIVE } as RundownInterface)

      expect(testee.getHistory()).toHaveLength(history.length)

      testee.deactivate()

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

    it('sets the Rundown to be in rehearsal mode', () => {
      const segment: Segment = EntityMockFactory.createSegment({ parts: [EntityMockFactory.createPart()] })
      const testee: Rundown = new Rundown({ mode: RundownMode.INACTIVE, segments: [segment] } as RundownInterface)

      testee.enterRehearsal()
      expect(testee.getMode()).toBe(RundownMode.REHEARSAL)
    })

    it('sets an empty rundown to be in rehearsal mode', () => {
      const testee: Rundown = EntityTestFactory.createRundown({id: 'emptyRundown', mode: RundownMode.INACTIVE})

      expect(testee.isRehearsal()).toBeFalsy()
      testee.enterRehearsal()
      expect(testee.isRehearsal()).toBeTruthy()
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
  })

  describe(Rundown.prototype.reset.name, () => {
    it('removes unsynced segments', () => {
      const onAirSegmentId: string = 'on-air-segment-id'
      const onAirPart: Part = EntityTestFactory.createPart({ segmentId: onAirSegmentId, isOnAir: true })
      const unsyncedOnAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, isUnsynced: true, isOnAir: true, parts: [onAirPart] })

      const nextSegmentId: string = 'next-segment-id'
      const nextPart: Part = EntityTestFactory.createPart({ segmentId: nextSegmentId, isNext: true })
      const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

      const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            part: onAirPart,
            segment: unsyncedOnAirSegment,
            owner: Owner.SYSTEM,
          },
          nextCursor: {
            part: nextPart,
            segment: nextSegment,
            owner: Owner.SYSTEM,
          },
          infinitePieces: new Map(),
        },
        segments: [unsyncedOnAirSegment, nextSegment]
      }))

      testee.reset()

      expect(testee.getSegments().length).toBe(1)
      expect(testee.getSegments()).toEqual(expect.arrayContaining([expect.objectContaining({ id: nextSegmentId })]))
    })

    it('removes unsynced parts', () => {
      const onAirSegmentId: string = 'on-air-segment-id'
      const unsyncedOnAirPart: Part = EntityTestFactory.createPart({ segmentId: onAirSegmentId, isOnAir: true, isUnsynced: true })
      const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, isOnAir: true, parts: [unsyncedOnAirPart] })

      const nextSegmentId: string = 'next-segment-id'
      const nextPart: Part = EntityTestFactory.createPart({ segmentId: nextSegmentId, isNext: true })
      const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

      const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            part: unsyncedOnAirPart,
            segment: onAirSegment,
            owner: Owner.SYSTEM,
          },
          nextCursor: {
            part: nextPart,
            segment: nextSegment,
            owner: Owner.SYSTEM,
          },
          infinitePieces: new Map(),
        },
        segments: [onAirSegment, nextSegment]
      }))

      testee.reset()

      expect(testee.getSegments().length).toBe(2)
      expect(testee.getSegments()).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: nextSegmentId }),
        expect.objectContaining({ id: onAirSegmentId, parts: expect.not.arrayContaining([expect.objectContaining({ id: unsyncedOnAirPart.id })]) }),
      ]))
    })
  })

  it('resets when the last remaining on air segment is unsynced', () => {
    const unsyncedOnAirSegmentId: string = 'unsynced-on-air-segment-id'
    const unsyncedOnAirPart: Part = EntityTestFactory.createPart({ segmentId: unsyncedOnAirSegmentId, isOnAir: true, isUnsynced: true })
    const unsyncedOnAirSegment: Segment = EntityTestFactory.createSegment({ id: unsyncedOnAirSegmentId, isOnAir: true, parts: [unsyncedOnAirPart], isUnsynced: true })

    const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
      mode: RundownMode.ACTIVE,
      alreadyActiveProperties: {
        activeCursor: {
          part: unsyncedOnAirPart,
          segment: unsyncedOnAirSegment,
          owner: Owner.SYSTEM,
        },
        nextCursor: undefined,
        infinitePieces: new Map(),
      },
      segments: [unsyncedOnAirSegment]
    }))

    testee.reset()
    expect(testee.getSegments().length).toBe(0)
    expect(testee.getActiveCursor()).toBeUndefined()
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

      describe('the Rundown is on air and has no active part', () => {
        describe('there are no other Segments in the Rundown', () => {
          it('sets the Segment as next', () => {
            const part: Part = EntityTestFactory.createPart()
            const segment: Segment = EntityTestFactory.createSegment( {parts: [part]})
            const testee: Rundown = new Rundown({mode: RundownMode.ACTIVE, alreadyActiveProperties: {activeCursor: undefined, nextCursor: undefined}} as RundownInterface)

            testee.addSegment(segment)

            expect(testee.getNextCursor()?.segment.id).toBe(segment.id)
          })
        })
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
        it('update the active cursor with the OnAir Part of the new Segment', () => {
          const segmentId: string = 'segmentId'
          const oldPart: Part = EntityTestFactory.createPart()
          const newSegmentOnAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, parts: [oldPart] })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: false, parts: [newSegmentOnAirPart] })

          const activeCursor: RundownCursor = {
            part: oldPart,
            segment: oldSegment,
            owner: Owner.SYSTEM
          }

          const testee: Rundown = new Rundown({ segments: [oldSegment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor
          } } as RundownInterface)

          expect(testee.getActiveCursor()?.part).not.toBe(newSegmentOnAirPart)
          testee.updateSegment(newSegment)
          expect(testee.getActiveCursor()?.part).toBe(newSegmentOnAirPart)
        })

        it('does not put the Parts of the old Segment in the new Segment', () => {
          const segmentId: string = 'segmentId'
          const oldPart: Part = EntityTestFactory.createPart()
          const newSegmentOnAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, parts: [oldPart] })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: false, parts: [newSegmentOnAirPart] })

          const activeCursor: RundownCursor = {
            part: oldPart,
            segment: oldSegment,
            owner: Owner.SYSTEM
          }

          const testee: Rundown = new Rundown({ segments: [oldSegment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor
          } } as RundownInterface)

          testee.updateSegment(newSegment)

          expect(newSegment.getParts().includes(oldPart)).toBeFalsy()
        })

        it('new Segment has infinite Pieces - updates infinite Pieces', () => {
          const segmentId: string = 'segmentId'
          const oldPart: Part = EntityTestFactory.createPart()
          const infinitePiece: Piece = EntityTestFactory.createPiece({ pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END })
          const newSegmentOnAirPart: Part = EntityTestFactory.createPart({ isOnAir: true, pieces: [infinitePiece] })
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, parts: [oldPart] })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: false, parts: [newSegmentOnAirPart] })

          const activeCursor: RundownCursor = {
            part: oldPart,
            segment: oldSegment,
            owner: Owner.SYSTEM
          }

          const testee: Rundown = new Rundown({ segments: [oldSegment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor,
            infinitePieces: new Map()
          } } as RundownInterface)

          expect(testee.getInfinitePieces()).toHaveLength(0)
          testee.updateSegment(newSegment)
          expect(testee.getInfinitePieces()).toContain(infinitePiece)
        })

        it('puts the new Segment on Air', () => {
          const segmentId: string = 'segmentId'
          const oldPart: Part = EntityTestFactory.createPart()
          const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
          const oldSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: true, parts: [oldPart] })
          const newSegment: Segment = EntityTestFactory.createSegment({ id: segmentId, isOnAir: false, parts: [onAirPart] })

          const testee: Rundown = new Rundown({ segments: [oldSegment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              part: oldPart,
              segment: oldSegment
            },
          } } as RundownInterface)

          expect(newSegment.isOnAir()).toBeFalsy()
          testee.updateSegment(newSegment)
          expect(newSegment.isOnAir()).toBeTruthy()
        })
      })

      // It should also update the next cursor, but those tests are covered by "addSegment()".
    })

    describe('when a non-on air segment containing the next part is updated', () => {
      describe('when the next part is invalid', () => {
        describe('when there are no valid parts after the on air part', () => {
          it('updates the on air part is marked as next', () => {
            const activeSegmentId: string = 'active-segment-id'
            const activePart: Part = EntityTestFactory.createPart({ id: 'active-part-id', segmentId: activeSegmentId, isOnAir: true })
            activePart.calculateTimings()
            const activeSegment: Segment = EntityTestFactory.createSegment({ id: activeSegmentId, isOnAir: true, parts: [activePart] })

            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

            const invalidity: Invalidity = { reason: 'some reason' }
            const updatedNextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true, invalidity })
            const updatedNextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [updatedNextPart] })

            const testee: Rundown = EntityTestFactory.createRundown({
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: activeSegment,
                  part: activePart,
                  owner: Owner.SYSTEM,
                },
                nextCursor: {
                  segment: nextSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              },
              segments: [activeSegment, nextSegment]
            })

            testee.updateSegment(updatedNextSegment)

            expect(testee.getNextCursor()?.segment).toBe(activeSegment)
            expect(testee.getNextCursor()?.part).toBe(activePart)
          })
        })

        describe('when there is a valid part after the on air part',() => {
          it('updates the next cursor to the next valid part from the active cursor', () => {
            const activeSegmentId: string = 'active-segment-id'
            const activePart: Part = EntityTestFactory.createPart({ id: 'active-part-id', segmentId: activeSegmentId, isOnAir: true })
            const secondPart: Part = EntityTestFactory.createPart({ id: 'second-part-id', segmentId: activeSegmentId })
            activePart.calculateTimings()
            const activeSegment: Segment = EntityTestFactory.createSegment({ id: activeSegmentId, isOnAir: true, parts: [activePart, secondPart] })

            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

            const invalidity: Invalidity = { reason: 'some reason' }
            const updatedNextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true, invalidity })
            const updatedNextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [updatedNextPart] })

            const testee: Rundown = EntityTestFactory.createRundown({
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: activeSegment,
                  part: activePart,
                  owner: Owner.SYSTEM,
                },
                nextCursor: {
                  segment: nextSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              },
              segments: [activeSegment, nextSegment]
            })

            testee.updateSegment(updatedNextSegment)

            expect(testee.getNextCursor()?.segment).toBe(activeSegment)
            expect(testee.getNextCursor()?.part).toBe(secondPart)
          })
        })
      })
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
      describe('Segment is not on air', () => {
        it('removes the Segment from the Rundown', () => {
          const segment: Segment = EntityTestFactory.createSegment()
          const testee: Rundown = new Rundown({ segments: [segment] } as RundownInterface)

          expect(testee.getSegments()).toContain(segment)
          testee.removeSegment(segment.id)
          expect(testee.getSegments()).not.toContain(segment)
        })
        describe('the Rundown is active and has no active part', () => {
          describe('Segment is the only Segment in the Rundown', () => {
            it('removes the next cursor', () => {
              const part: Part = EntityTestFactory.createPart()
              const segment: Segment = EntityTestFactory.createSegment( {parts: [part]})
              const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {activeCursor: undefined, nextCursor: {segment, part}} } as RundownInterface)

              testee.removeSegment(segment.id)
              expect(testee.getNextCursor()).toBe(undefined)
            })
          })
        })
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

    describe('when a part is added right after the on air part in same segment', () => {
      describe ('when the segment marked as next is not the on air segment', () => {
        describe('when the next cursor is set by the system', () => {
          it('marks the on air segment as next', () => {
            const onAirSegmentId: string =  'on-air-segment-id'
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'on-air-part-id', segmentId: onAirSegmentId, isOnAir: true })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, parts: [onAirPart] })

            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, parts: [nextPart] })

            const partToAdd: Part = EntityTestFactory.createPart({ id: 'part-to-add-id', segmentId: onAirSegmentId })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              }
            }))

            testee.addPart(partToAdd)

            const result: Segment | undefined = testee.getSegments().find(segment => segment.isNext())
            expect(result?.id).toBe(onAirSegmentId)
          })

          it('marks the added part as next', () => {
            const onAirSegmentId: string =  'on-air-segment-id'
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'on-air-part-id', segmentId: onAirSegmentId, isOnAir: true })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, parts: [onAirPart] })

            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, parts: [nextPart] })

            const partToAddId: string = 'part-to-add-id'
            const partToAdd: Part = EntityTestFactory.createPart({ id: partToAddId, segmentId: onAirSegmentId })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              }
            }))

            testee.addPart(partToAdd)

            const result: Part | undefined = testee.getSegments()
              .find(segment => segment.isNext())?.getParts()
              .find(part => part.id === partToAddId)
            expect(result?.id).toBe(partToAddId)
          })

          it('unmarks the segment previously marked as next', () => {
            const onAirSegmentId: string =  'on-air-segment-id'
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'on-air-part-id', segmentId: onAirSegmentId, isOnAir: true })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, parts: [onAirPart] })

            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

            const partToAdd: Part = EntityTestFactory.createPart({ id: 'part-to-add-id', segmentId: onAirSegmentId })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              }
            }))

            testee.addPart(partToAdd)

            const result: Segment | undefined = testee.getSegments().find(segment => segment.id == nextSegmentId)
            expect(result?.isNext()).toBe(false)
          })

          it('unmarks the part previously marked as next', () => {
            const onAirSegmentId: string =  'on-air-segment-id'
            const onAirPart: Part = EntityTestFactory.createPart({ id: 'on-air-part-id', segmentId: onAirSegmentId, isOnAir: true })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, parts: [onAirPart] })

            const nextPartId: string = 'next-part-id'
            const nextSegmentId: string = 'next-segment-id'
            const nextPart: Part = EntityTestFactory.createPart({ id: nextPartId, segmentId: nextSegmentId, isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, parts: [nextPart] })

            const partToAdd: Part = EntityTestFactory.createPart({ id: 'part-to-add-id', segmentId: onAirSegmentId })

            const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
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
                  owner: Owner.SYSTEM,
                },
                infinitePieces: new Map(),
              }
            }))

            testee.addPart(partToAdd)

            const result: Part | undefined = testee.getSegments()
              .find(segment => segment.id == nextSegmentId)?.getParts()
              .find(part => part.id === nextPartId)
            expect(result?.isNext()).toBe(false)
          })
        })
      })
    })

    describe('when the next cursor has an external owner', () => {
      it('does not change the next cursor', () => {
        const onAirSegmentId: string =  'on-air-segment-id'
        const onAirPart: Part = EntityTestFactory.createPart({ id: 'on-air-part-id', segmentId: onAirSegmentId, isOnAir: true })
        const onAirSegment: Segment = EntityTestFactory.createSegment({ id: onAirSegmentId, parts: [onAirPart] })

        const nextPartId: string = 'next-part-id'
        const nextSegmentId: string = 'next-segment-id'
        const nextPart: Part = EntityTestFactory.createPart({ id: nextPartId, segmentId: nextSegmentId, isNext: true })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, parts: [nextPart] })

        const partToAdd: Part = EntityTestFactory.createPart({ id: 'part-to-add-id', segmentId: onAirSegmentId })

        const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
          segments: [onAirSegment, nextSegment],
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              segment: onAirSegment,
              part: onAirPart,
              owner: Owner.SYSTEM,
            },
            nextCursor: {
              segment: nextSegment,
              part: nextPart,
              owner: Owner.EXTERNAL,
            },
            infinitePieces: new Map(),
          }
        }))

        testee.addPart(partToAdd)

        const result: Part | undefined = testee.getSegments()
          .find(segment => segment.id == nextSegmentId)?.getParts()
          .find(part => part.id === nextPartId)
        expect(result?.isNext()).toBe(true)
      })
    })
  })

  describe(Rundown.prototype.updatePart.name, () => {
    describe('Part does not have a Segment id for any Segments in the Rundown', () => {
      it('throws a NotFound exception', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'partId', segmentId: 'nonExistingSegmentId' })
        const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface())

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
      const nextSegmentId: string = 'next-segment-id'
      const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', isNext: true, segmentId: nextSegmentId })
      const nextPartSpy: Part = spy(nextPart)
      const nextSegment: Segment = EntityTestFactory.createSegment({ id: nextSegmentId, isNext: true, parts: [nextPart] })

      const activeSegmentId: string = 'active-segment-id'
      const activePart: Part = EntityTestFactory.createPart({ id: 'active-part-id', segmentId: activeSegmentId, isOnAir: true })
      const otherPartInActiveSegment: Part = EntityTestFactory.createPart({ id: 'other-part-in-active-segment-id', segmentId: activeSegmentId })
      const activeSegment: Segment = EntityTestFactory.createSegment({ id: activeSegmentId, isOnAir: true, parts: [activePart, otherPartInActiveSegment] })

      const testee: Rundown = EntityTestFactory.createRundown({
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
          infinitePieces: new Map(),
        },
        segments: [
          activeSegment,
          nextSegment,
        ],
      })

      testee.setNext(activeSegment.id, otherPartInActiveSegment.id)

      verify(nextPartSpy.reset()).once()
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
        const testee: Rundown = new Rundown({
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

        const result: () => void = () => testee.setNext(activeSegment.id, activePart.id)

        expect(result).toThrow(OnAirException)
      })
    })

    describe('next Segment is invalid', () => {
      it('does not call setNext on the Segment', () => {
        const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'active-segment-id', parts: [activePart] })
        const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', isNext: true })
        const invalidity: Invalidity = {
          reason: 'Some Reason'
        }
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'next-segment-id', invalidity, isNext: true, parts: [nextPart]})
        const testee: Rundown = new Rundown({
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
            nextSegment
          ],
        } as RundownInterface)

        const spiedNextSegment: Segment = spy(nextSegment)

        try {
          testee.setNext(nextSegment.id, nextPart.id)
        } catch (e) {
          // Do nothing - the error is expected.
        }

        verify(spiedNextSegment.setAsNext()).never()
      })

      it('throws InvalidSegmentException', () => {
        const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'active-segment-id', parts: [activePart] })
        const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', isNext: true })
        const invalidity: Invalidity = {
          reason: 'Some Reason'
        }
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'next-segment-id', invalidity, isNext: true, parts: [nextPart]})
        const testee: Rundown = new Rundown({
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
            nextSegment
          ],
        } as RundownInterface)


        expect(() => testee.setNext(nextSegment.id, nextPart.id)).toThrow(InvalidSegmentException)
      })
    })
    describe('when next part is invalid', () => {
      it('does not call setNext on the next segment nor the next part', () => {
        const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'active-segment-id', parts: [activePart] })
        const firstPartInNextSegment: Part = EntityTestFactory.createPart({ id: 'first-part-in-next-segment-id' })
        const invalidity: Invalidity = {
          reason: 'Some reason'
        }
        const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', invalidity })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'next-segment-id', parts: [firstPartInNextSegment, nextPart]})
        const testee: Rundown = EntityTestFactory.createRundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              segment: activeSegment,
              part: activePart,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              segment: nextSegment,
              part: firstPartInNextSegment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
          segments: [
            activeSegment,
            nextSegment
          ],
        })
        const spiedNextSegment: Segment = spy(nextSegment)
        const spiedNextPart: Part = spy(nextPart)

        try {
          testee.setNext(nextSegment.id, nextPart.id)
        } catch {
          // Do nothing. The error is expected.
        }

        verify(spiedNextSegment.setAsNext()).never()
        verify(spiedNextPart.setAsNext()).never()
      })

      it('throws an invalid part exception', () => {
        const activePart: Part = EntityMockFactory.createPart({ id: 'active-part-id', isOnAir: true })
        const activeSegment: Segment = EntityTestFactory.createSegment({ id: 'active-segment-id', parts: [activePart] })
        const firstPartInNextSegment: Part = EntityTestFactory.createPart({ id: 'first-part-in-next-segment-id' })
        const invalidity: Invalidity = {
          reason: 'Some reason'
        }
        const nextPart: Part = EntityTestFactory.createPart({ id: 'next-part-id', invalidity })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'next-segment-id', parts: [firstPartInNextSegment, nextPart]})
        const testee: Rundown = EntityTestFactory.createRundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              segment: activeSegment,
              part: activePart,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              segment: nextSegment,
              part: firstPartInNextSegment,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map(),
          },
          segments: [
            activeSegment,
            nextSegment
          ],
        })

        const result: () => void = () => testee.setNext(nextSegment.id, nextPart.id)

        expect(result).toThrow(InvalidPartException)
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

  describe(Rundown.prototype.insertPartAsNext.name, () => {
    describe('there is no onAir Part', () => {
      it ('throws an exception', () => {
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted' })

        const testee: Rundown = new Rundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: undefined
          }
        } as RundownInterface)

        expect(() => testee.insertPartAsNext(partToBeInserted)).toThrow()
      })
    })

    describe('there is an onAir Part', () => {
      describe('next Part is in the same Segment as the onAir Part', () => {
        describe('next Part is right after the onAir Part', () => {
          it('sets the rank of the inserted Part to be between the onAir and next Parts', () => {
            const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', rank: -1, ingestedPart: undefined })
            const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true, rank: 5 })
            const nextPart: Part = EntityTestFactory.createPart({ isNext: true, rank: 10 })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ parts: [onAirPart, nextPart] })

            const expectedRank: number =  (nextPart.getRank() - onAirPart.getRank()) / 2 + onAirPart.getRank()

            const testee: Rundown = new Rundown({
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: onAirSegment,
                  part: onAirPart,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  segment: onAirSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM
                }
              },
              segments: [onAirSegment]
            } as RundownInterface)

            testee.insertPartAsNext(partToBeInserted)

            expect(partToBeInserted.getRank()).toBe(expectedRank)
          })
        })

        describe('next Part is not right after the onAir Part', () => {
          it('sets the rank to be between the onAir Part and the part after the onAir Part', () => {
            const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', rank: -1, ingestedPart: undefined })
            const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true, rank: 5 })
            const partBetweenOnAirAndNextPart: Part = EntityTestFactory.createPart({ id: 'partBetweenOnAirAndNextPart', rank: 7 })
            const nextPart: Part = EntityTestFactory.createPart({ isNext: true, rank: 10 })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ parts: [onAirPart, partBetweenOnAirAndNextPart, nextPart] })

            const expectedRank: number =  (partBetweenOnAirAndNextPart.getRank() - onAirPart.getRank()) / 2 + onAirPart.getRank()

            const testee: Rundown = new Rundown({
              mode: RundownMode.ACTIVE,
              alreadyActiveProperties: {
                activeCursor: {
                  segment: onAirSegment,
                  part: onAirPart,
                  owner: Owner.SYSTEM
                },
                nextCursor: {
                  segment: onAirSegment,
                  part: nextPart,
                  owner: Owner.SYSTEM
                }
              },
              segments: [onAirSegment]
            } as RundownInterface)

            testee.insertPartAsNext(partToBeInserted)

            expect(partToBeInserted.getRank()).toBe(expectedRank)
          })
        })
      })

      describe('next Part is another Segment', () => {
        describe('onAir Part is last Part in the Segment', () => {
          it('sets the rank to be the rank of the onAir Part plus 0.1', () => {
            const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', rank: -1, ingestedPart: undefined })
            const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true, rank: 4 })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ parts: [onAirPart] })
            const nextPart: Part = EntityTestFactory.createPart({ isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ parts: [nextPart] })

            const expectedRank: number =  onAirPart.getRank() + 1

            const testee: Rundown = new Rundown({
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
                }
              },
              segments: [onAirSegment]
            } as RundownInterface)

            testee.insertPartAsNext(partToBeInserted)

            expect(partToBeInserted.getRank()).toBe(expectedRank)
          })
        })

        describe('there is a Part after the onAir Part in the Segment', () => {
          it ('sets the rank to be between the onAir Part and the Part after the onAir Part', () => {
            const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', rank: -1, ingestedPart: undefined })

            const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true, rank: 4 })
            const partAfterOnAirPart: Part = EntityTestFactory.createPart({ id: 'partAfterOnAirPart', rank: 6 })
            const onAirSegment: Segment = EntityTestFactory.createSegment({ parts: [onAirPart, partAfterOnAirPart] })

            const nextPart: Part = EntityTestFactory.createPart({ isNext: true })
            const nextSegment: Segment = EntityTestFactory.createSegment({ parts: [nextPart] })

            // The new rank is the rank of the onAir Part plus the distance between the onAir Part and the next Part: 4 + ((6 - 4) / 2)
            const expectedRank: number =  5

            const testee: Rundown = new Rundown({
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
                }
              },
              segments: [onAirSegment]
            } as RundownInterface)

            testee.insertPartAsNext(partToBeInserted)

            expect(partToBeInserted.getRank()).toBe(expectedRank)
          })
        })
      })
    })
  })

  describe(Rundown.prototype.pruneOldUnplannedPartsOnActiveSegment.name, () => {
    describe('there are less Parts on the active Segment than the threshold', () => {
      it('does not remove any Parts from the active Segment', () => {
        const part: Part = EntityTestFactory.createPart()
        const segment: Segment = EntityTestFactory.createSegment({ parts: [part] })
        const threshold: number = 3

        const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
          activeCursor: {
            segment
          }
        } } as RundownInterface)

        expect(testee.getActiveSegment().getParts()).toHaveLength(1)
        testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
        expect(testee.getActiveSegment().getParts()).toHaveLength(1)
      })

      it('returns an empty array', () => {
        const part: Part = EntityTestFactory.createPart()
        const segment: Segment = EntityTestFactory.createSegment({ parts: [part] })
        const threshold: number = 3

        const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
          activeCursor: {
            segment
          }
        } } as RundownInterface)

        const result: string[] = testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
        expect(result).toHaveLength(0)
      })
    })

    describe('there are more Parts on the active Segment than the threshold', () => {
      describe('there is no active Part on the Segment', () => {
        it('does not remove any Parts', () => {
          const partOne: Part = EntityTestFactory.createPart()
          const partTwo: Part = EntityTestFactory.createPart()
          const partThree: Part = EntityTestFactory.createPart()
          const segment: Segment = EntityTestFactory.createSegment({ parts: [partOne, partTwo, partThree] })
          const threshold: number = 2

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment
            }
          } } as RundownInterface)

          expect(testee.getActivePart()).toBeUndefined()
          expect(testee.getActiveSegment().getParts()).toHaveLength(3)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(testee.getActiveSegment().getParts()).toHaveLength(3)
        })

        it('returns an empty array', () => {
          const partOne: Part = EntityTestFactory.createPart()
          const partTwo: Part = EntityTestFactory.createPart()
          const partThree: Part = EntityTestFactory.createPart()
          const segment: Segment = EntityTestFactory.createSegment({ parts: [partOne, partTwo, partThree] })
          const threshold: number = 2

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment
            }
          } } as RundownInterface)

          const result: string[] = testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(result).toHaveLength(0)
        })
      })

      describe('there is an active Part on the Segment', () => {
        it('active Part is planned - does not remove the active Part', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const onAirPlannedPart: Part = EntityTestFactory.createPart({ isOnAir: true, ingestedPart: EntityTestFactory.createIngestedPart() })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, onAirPlannedPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirPlannedPart
            }
          } } as RundownInterface)

          expect(segment.getParts()).toContain(onAirPlannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(onAirPlannedPart)
        })

        it('active Part is not planned - does not remove the active Part', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const onAirUnplannedPart: Part = EntityTestFactory.createPart({ isOnAir: true, ingestedPart: undefined })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, onAirUnplannedPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirUnplannedPart
            }
          } } as RundownInterface)

          expect(segment.getParts()).toContain(onAirUnplannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(onAirUnplannedPart)
        })

        it('next Part is planned - does not remove the next Part', () => {
          const segmentId: string = 'segment-id'
          const unplannedPartOne: Part = EntityTestFactory.createPart({ segmentId, ingestedPart: undefined })
          const onAirPart: Part = EntityTestFactory.createPart({ segmentId, isOnAir: true })
          const nextPlannedPart: Part = EntityTestFactory.createPart({ segmentId, isNext: true, ingestedPart: EntityTestFactory.createIngestedPart() })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, onAirPart, nextPlannedPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment,
                part: onAirPart,
                owner: Owner.SYSTEM,
              },
              nextCursor: {
                segment,
                part: nextPlannedPart,
                owner: Owner.SYSTEM,
              },
              infinitePieces: new Map(),
            }
          }))

          expect(segment.getParts()).toContain(nextPlannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(nextPlannedPart)
        })

        it('next Part is not planned - does not remove the next Part', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
          const nextUnplannedPart: Part = EntityTestFactory.createPart({ isNext: true, ingestedPart: undefined })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, onAirPart, nextUnplannedPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirPart
            },
            nextCursor: {
              segment,
              part: nextUnplannedPart
            }
          } } as RundownInterface)

          expect(segment.getParts()).toContain(nextUnplannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(nextUnplannedPart)
        })

        it('previous Part is planned - does not remove the previous Part', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const previousPlannedPart: Part = EntityTestFactory.createPart({ ingestedPart: EntityTestFactory.createIngestedPart() })
          const onAirPart: Part = EntityTestFactory.createPart()

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, previousPlannedPart, onAirPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
            segments: [segment],
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment,
                part: previousPlannedPart, // To set the previous Part we need to set it as the active and do a Take.
                owner: Owner.SYSTEM,
              },
              nextCursor: {
                segment,
                part: onAirPart, // When we do the Take, this will become the onAir Part.
                owner: Owner.SYSTEM,
              },
              infinitePieces: new Map(),
            } }))
          testee.takeNext() // Necessary to set the previous Part.

          expect(segment.getParts()).toContain(previousPlannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(previousPlannedPart)
        })

        it('previous Part is not planned - does not remove the previous Part', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const previousUnplannedPart: Part = EntityTestFactory.createPart({ isOnAir: true, ingestedPart: undefined, timings: {} as PartTimings })
          const onAirPart: Part = EntityTestFactory.createPart({ })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, previousUnplannedPart, onAirPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: previousUnplannedPart // To set the previous Part we need to set it as the active and do a Take.
            },
            nextCursor: {
              segment,
              part: onAirPart // When we do the Take, this will become the onAir Part.
            }
          } } as RundownInterface)
          testee.takeNext() // Necessary to set the previous Part.

          expect(segment.getParts()).toContain(previousUnplannedPart)
          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(segment.getParts()).toContain(previousUnplannedPart)
        })

        it('does not remove any planned Parts', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const unplannedPartTwo: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const plannedPartOne: Part = EntityTestFactory.createPart({ ingestedPart: EntityTestFactory.createIngestedPart() })
          const plannedPartTwo: Part = EntityTestFactory.createPart({ ingestedPart: EntityTestFactory.createIngestedPart() })
          const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, unplannedPartTwo, plannedPartOne, plannedPartTwo, onAirPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirPart
            }
          } } as RundownInterface)

          expect(segment.getParts()).toContain(unplannedPartOne)
          expect(segment.getParts()).toContain(unplannedPartTwo)
          expect(segment.getParts()).toContain(plannedPartOne)
          expect(segment.getParts()).toContain(plannedPartTwo)

          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)

          expect(segment.getParts()).not.toContain(unplannedPartOne)
          expect(segment.getParts()).not.toContain(unplannedPartTwo)
          expect(segment.getParts()).toContain(plannedPartOne)
          expect(segment.getParts()).toContain(plannedPartTwo)
        })

        it('does not remove any unplanned Parts after the active Part', () => {
          const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
          const unplannedPartOneAfterActivePart: Part = EntityTestFactory.createPart({ ingestedPart: undefined })
          const unplannedPartTwoAfterActivePart: Part = EntityTestFactory.createPart({ ingestedPart: undefined })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [onAirPart, unplannedPartOneAfterActivePart, unplannedPartTwoAfterActivePart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirPart
            }
          } } as RundownInterface)

          expect(segment.getParts()).toContain(onAirPart)
          expect(segment.getParts()).toContain(unplannedPartOneAfterActivePart)
          expect(segment.getParts()).toContain(unplannedPartTwoAfterActivePart)

          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)

          expect(segment.getParts()).toContain(onAirPart)
          expect(segment.getParts()).toContain(unplannedPartOneAfterActivePart)
          expect(segment.getParts()).toContain(unplannedPartTwoAfterActivePart)
        })

        it('removes all unplanned Parts before the previous Part', () => {
          const rundownId: string = 'rundown-id'
          const segmentId: string = 'segment-id'
          const unplannedPartOne: Part = EntityTestFactory.createPart({ rundownId, segmentId, ingestedPart: undefined })
          const unplannedPartTwo: Part = EntityTestFactory.createPart({ rundownId, segmentId, ingestedPart: undefined })
          const unplannedPartThree: Part = EntityTestFactory.createPart({ rundownId, segmentId, ingestedPart: undefined })
          const previousPart: Part = EntityTestFactory.createPart( { rundownId, segmentId, ingestedPart: undefined })
          const onAirPart: Part = EntityTestFactory.createPart({ rundownId, segmentId, ingestedPart: undefined })
          const unplannedPartAfterActivePart: Part = EntityTestFactory.createPart({ id: 'unplannedPartAfterActivePart', rundownId, segmentId, ingestedPart: undefined })

          const segment: Segment = EntityTestFactory.createSegment({ id: segmentId, rundownId, parts: [unplannedPartOne, unplannedPartTwo, unplannedPartThree, previousPart, onAirPart, unplannedPartAfterActivePart] })
          const threshold: number = 2

          const testee: Rundown = new Rundown(EntityTestFactory.createRundownInterface({
            id: rundownId,
            segments: [segment],
            mode: RundownMode.ACTIVE, alreadyActiveProperties: {
              activeCursor: {
                segment,
                part: previousPart, // To set the previous Part we need to set it as the active and do a Take.
                owner: Owner.SYSTEM,
              },
              nextCursor: {
                segment,
                part: onAirPart, // When we do the Take, this will become the onAir Part.
                owner: Owner.SYSTEM,
              },
              infinitePieces: new Map(),
            }
          }))
          testee.takeNext() // Necessary to set the previous Part.


          expect(segment.getParts()).toContain(unplannedPartOne)
          expect(segment.getParts()).toContain(unplannedPartTwo)
          expect(segment.getParts()).toContain(unplannedPartThree)
          expect(segment.getParts()).toContain(unplannedPartAfterActivePart)

          testee.pruneOldUnplannedPartsOnActiveSegment(threshold)

          expect(segment.getParts()).not.toContain(unplannedPartOne)
          expect(segment.getParts()).not.toContain(unplannedPartTwo)
          expect(segment.getParts()).not.toContain(unplannedPartThree)
          expect(segment.getParts()).toContain(unplannedPartAfterActivePart)
        })


        it('returns all PartIds of the removed Parts', () => {
          const unplannedPartOne: Part = EntityTestFactory.createPart({ id: 'unplannedPartOne', ingestedPart: undefined })
          const unplannedPartTwo: Part = EntityTestFactory.createPart({ id: 'unplannedPartTwo', ingestedPart: undefined })
          const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })

          const segment: Segment = EntityTestFactory.createSegment({ parts: [unplannedPartOne, unplannedPartTwo, onAirPart] })
          const threshold: number = 1

          const testee: Rundown = new Rundown({ segments: [segment], mode: RundownMode.ACTIVE, alreadyActiveProperties: {
            activeCursor: {
              segment,
              part: onAirPart
            }
          } } as RundownInterface)

          const result: string[] = testee.pruneOldUnplannedPartsOnActiveSegment(threshold)
          expect(result).toHaveLength(2)
          expect(result).toContain(unplannedPartOne.id)
          expect(result).toContain(unplannedPartTwo.id)
        })
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
  return new Rundown(EntityTestFactory.createRundownInterface({
    mode: RundownMode.ACTIVE,
    alreadyActiveProperties: {
      activeCursor,
      nextCursor,
      infinitePieces: new Map(),
    },
    segments: [existingActiveSegment, existingNextSegment]
  }))
}
