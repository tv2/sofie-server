import { PieceLifespan } from '../../enums/piece-lifespan'
import { Piece } from '../piece'
import { Part, PartInterface } from '../part'
import { Segment, SegmentInterface } from '../segment'
import { EntityMockFactory } from './entity-mock-factory'
import { capture, instance, spy, verify } from '@typestrong/ts-mockito'
import { EntityTestFactory } from './entity-test-factory'
import { UNSYNCED_ID_POSTFIX } from '../../value-objects/unsynced_constants'
import { AlreadyExistException } from '../../exceptions/already-exist-exception'
import { NotFoundException } from '../../exceptions/not-found-exception'
import { Invalidity } from '../../value-objects/invalidity'
import { InvalidSegmentException } from '../../exceptions/invalid-segment-exception'
import { LastPartInSegmentException } from '../../exceptions/last-part-in-segment-exception'

describe(Segment.name, () => {
  describe(Segment.prototype.putOnAir, () => {
    describe('the Segment is valid', () => {
      it('marks the Segment as OnAir', () => {
        const testee: Segment = new Segment({ isOnAir: false, invalidity: undefined } as SegmentInterface)
        expect(testee.isOnAir()).toBeFalsy()
        testee.putOnAir()
        expect(testee.isOnAir()).toBeTruthy()
      })

      it('sets the executedAtEpochTime to now', () => {
        const now: number = Date.now()
        jest.useFakeTimers()
        jest.setSystemTime(now)

        const testee: Segment = new Segment({ executedAtEpochTime: undefined, invalidity: undefined } as SegmentInterface)
        expect(testee.getExecutedAtEpochTime()).toBeFalsy()
        testee.putOnAir()
        expect(testee.getExecutedAtEpochTime()).toBe(now)
      })
    })
    describe('the Segment is invalid', () => {
      it('throws InvalidSegmentException', () => {
        const invalidity: Invalidity = {
          reason: 'SomeReason'
        }
        const testee: Segment = new Segment({ invalidity } as SegmentInterface)
        expect(() => testee.putOnAir()).toThrow(InvalidSegmentException)
      })
    })
  })

  describe(Segment.prototype.setAsNext, () => {
    describe('the Segment is valid', () => {
      it('marks the Segment as next', () => {
        const testee: Segment = new Segment({ isNext: false, invalidity: undefined } as SegmentInterface)
        expect(testee.isNext()).toBeFalsy()
        testee.setAsNext()
        expect(testee.isNext()).toBeTruthy()
      })

      describe('the Segment is OnAir', () => {
        it('does not reset the Segment', () => {
          const testee: Segment = new Segment({ isOnAir: true, invalidity: undefined } as SegmentInterface)
          const spiedTestee: Segment = spy(testee)
          testee.setAsNext()
          verify(spiedTestee.reset()).never()
        })
      })
      describe('the Segment is not OnAir', () => {
        it('resets the Segment', () => {
          const testee: Segment = new Segment({ isOnAir: false, invalidity: undefined } as SegmentInterface)
          const spiedTestee: Segment = spy(testee)
          testee.setAsNext()
          verify(spiedTestee.reset()).once()
        })
      })
    })
    describe('the Segment is invalid', () => {
      it('throws InvalidSegmentException', () => {
        const invalidity: Invalidity = {
          reason: 'SomeReason'
        }
        const testee: Segment = new Segment({ invalidity } as SegmentInterface)
        expect(() => testee.setAsNext()).toThrow(InvalidSegmentException)
      })
    })
  })

  describe(Segment.prototype.getFirstSpanningPieceForEachLayerBeforePart.name, () => {
    describe('Segment has two Parts', () => {
      describe('One Part is "after" the search point', () => {
        it('does not include the Piece from the last Part', () => {
          const pieceBefore: Piece = EntityMockFactory.createPiece({
            id: 'pieceBefore',
            layer: 'someLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const partBefore: Part = EntityMockFactory.createPart(
            { id: 'partBefore', pieces: [pieceBefore] },
            { piecesWithLifespanFilters: [pieceBefore] }
          )

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const pieceAfter: Piece = EntityMockFactory.createPiece({
            id: 'pieceAfter',
            layer: 'someOtherLayer',
            pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
          })
          const partAfter: Part = EntityMockFactory.createPart(
            { id: 'partAfter', pieces: [pieceAfter] },
            { piecesWithLifespanFilters: [pieceAfter] }
          )

          const testee: Segment = new Segment({
            parts: [partBefore, partToSearchBefore, partAfter],
          } as SegmentInterface)

          const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
            partToSearchBefore,
            new Set()
          )
          expect(result).toContain(pieceBefore)
          expect(result).not.toContain(partAfter)
        })
      })

      describe('both Parts are before the search point', () => {
        describe('Each Part has two Pieces. One Piece on each is a "spanning" Piece', () => {
          describe('it has to find "after" both Parts', () => {
            it('returns the "spanning" Pieces of both Parts', () => {
              const pieceTwo: Piece = EntityMockFactory.createPiece({
                id: '2',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
                layer: 'someLayer',
              })
              const partOne: Part = EntityMockFactory.createPart(
                {
                  id: '1',
                  rank: 1,
                  pieces: [EntityMockFactory.createPiece({ id: '1' }), pieceTwo],
                },
                {
                  piecesWithLifespanFilters: [pieceTwo],
                }
              )

              const pieceFour: Piece = EntityMockFactory.createPiece({
                id: '4',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
                layer: 'someOtherLayer',
              })
              const partTwo: Part = EntityMockFactory.createPart(
                {
                  id: '2',
                  rank: 2,
                  pieces: [EntityMockFactory.createPiece({ id: '3' }), pieceFour],
                },
                {
                  piecesWithLifespanFilters: [pieceFour],
                }
              )

              const partToSearchBefore: Part = EntityMockFactory.createPart({
                id: '3',
                rank: 3,
              })

              const testee: Segment = new Segment({
                parts: [partOne, partTwo, partToSearchBefore],
              } as SegmentInterface)
              const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
                partToSearchBefore,
                new Set()
              )

              expect(result).toHaveLength(2)
              expect(result).toContain(pieceTwo)
              expect(result).toContain(pieceFour)
            })
          })

          describe('it has to find before the second Part', () => {
            it('returns the "spanning" Piece of the first Part', () => {
              const piece: Piece = EntityMockFactory.createPiece({
                id: '2',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
              })
              const partOne: Part = EntityMockFactory.createPart(
                {
                  id: '1',
                  rank: 1,
                  pieces: [EntityMockFactory.createPiece({ id: '1' }), piece],
                },
                {
                  piecesWithLifespanFilters: [piece],
                }
              )
              const pieceFour: Piece = EntityMockFactory.createPiece({
                id: '4',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
              })
              const partTwo: Part = EntityMockFactory.createPart(
                {
                  id: '2',
                  rank: 2,
                  pieces: [EntityMockFactory.createPiece({ id: '3' }), pieceFour],
                },
                {
                  piecesWithLifespanFilters: [pieceFour],
                }
              )
              const testee: Segment = new Segment({
                parts: [partOne, partTwo],
              } as SegmentInterface)

              const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
                partTwo,
                new Set()
              )

              expect(result).toHaveLength(1)
              expect(result).toContain(piece)
            })
          })
        })

        describe('both Parts has a "spanning" Piece on the same layer', () => {
          it('returns the "spanning" Piece of the latest layer', () => {
            const specificLayer: string = 'specificLayer'
            const pieceOne: Piece = EntityMockFactory.createPiece({
              id: '1',
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
              layer: specificLayer,
            })
            const pieceTwo: Piece = EntityMockFactory.createPiece({
              id: '2',
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
              layer: specificLayer,
            })

            const part: Part = EntityMockFactory.createPart(
              {
                id: '1',
                rank: 1,
                pieces: [pieceOne, pieceTwo],
              },
              {
                piecesWithLifespanFilters: [pieceOne, pieceTwo],
              }
            )
            const partToSearchBefore: Part = EntityMockFactory.createPart({ id: '3', rank: 3 })

            const testee: Segment = new Segment({
              parts: [part, partToSearchBefore],
            } as SegmentInterface)

            const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
              partToSearchBefore,
              new Set()
            )

            expect(result).toHaveLength(1)
            expect(result).toContain(pieceTwo)
          })
        })
      })
    })

    describe('Segment has one Part', () => {
      describe('the Part has two "spanning" Pieces', () => {
        describe('one Piece is on the ignored layers', () => {
          it('returns the Piece not on the ignored layers', () => {
            const layerToBeIgnored: string = 'layerToBeIgnored'
            const pieceOne: Piece = EntityMockFactory.createPiece({
              id: '1',
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
            })
            const pieceTwo: Piece = EntityMockFactory.createPiece({
              id: '2',
              pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
              layer: layerToBeIgnored,
            })

            const part: Part = EntityMockFactory.createPart(
              {
                id: '1',
                rank: 1,
                pieces: [pieceOne, pieceTwo],
              },
              {
                piecesWithLifespanFilters: [pieceOne, pieceTwo],
              }
            )
            const partToSearchBefore: Part = EntityMockFactory.createPart({
              id: '3',
              rank: 3,
            })

            const testee: Segment = new Segment({
              parts: [part, partToSearchBefore],
            } as SegmentInterface)

            const result: Piece[] = testee.getFirstSpanningPieceForEachLayerBeforePart(
              partToSearchBefore,
              new Set([layerToBeIgnored])
            )

            expect(result).toHaveLength(1)
            expect(result).toContain(pieceOne)
          })
        })
      })

      describe('it calls getPiecesWithLifespan on Part', () => {
        it('with PieceLifespan.SPANNING_UNTIL_RUNDOWN_END', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_RUNDOWN_END)
        })

        it('with PieceLifespan.SPANNING_UNTIL_SEGMENT_END', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
        })

        it('with PieceLifespan.START_SPANNING_THEN_STICKY', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).toContain(PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN)
        })

        it('does not call with PieceLifespan.WITHIN_PART', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).not.toContain(PieceLifespan.WITHIN_PART)
        })

        it('does not call with PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE)
        })

        it('does not call with PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE', () => {
          const mockPart: Part = EntityMockFactory.createPartMock()
          const part: Part = instance(mockPart)

          const partToSearchBefore: Part = EntityMockFactory.createPart({ id: 'searchPart' })

          const testee: Segment = new Segment({ parts: [part, partToSearchBefore] } as SegmentInterface)

          testee.getFirstSpanningPieceForEachLayerBeforePart(partToSearchBefore, new Set())

          const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
          expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE)
        })
      })
    })
  })

  describe(Segment.prototype.getFirstSpanningRundownPieceForEachLayerForAllParts.name, () => {
    describe('it has one Part', () => {
      describe('Part has two Pieces', () => {
        describe('Pieces are on different layers', () => {
          it('returns both Pieces', () => {
            const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
            const pieceTwo: Piece = EntityMockFactory.createPiece({
              id: 'pieceTwo',
              layer: 'someOtherLayer',
            })

            const part: Part = EntityMockFactory.createPart(
              { pieces: [pieceOne, pieceTwo] },
              { piecesWithLifespanFilters: [pieceOne, pieceTwo] }
            )

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
            expect(result).toContain(pieceOne)
            expect(result).toContain(pieceTwo)
          })
        })

        describe('Pieces are on same layer', () => {
          it('returns the latest Piece', () => {
            const layer: string = 'someLayer'
            const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer })
            const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer })

            const part: Part = EntityMockFactory.createPart(
              { pieces: [pieceOne, pieceTwo] },
              { piecesWithLifespanFilters: [pieceOne, pieceTwo] }
            )

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
            expect(result).not.toContain(pieceOne)
            expect(result).toContain(pieceTwo)
          })
        })

        describe('it has one Piece on a layer that should be ignored', () => {
          it('does not return that Piece', () => {
            const layerToIgnore: string = 'layerToIgnore'
            const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
            const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer: layerToIgnore })

            const part: Part = EntityMockFactory.createPart(
              { pieces: [pieceOne, pieceTwo] },
              { piecesWithLifespanFilters: [pieceOne, pieceTwo] }
            )

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(
              new Set([layerToIgnore])
            )
            expect(result).toContain(pieceOne)
            expect(result).not.toContain(pieceTwo)
          })
        })
      })

      describe('Part has one Piece', () => {
        describe('it calls getPiecesWithLifespan on Part', () => {
          it('with PieceLifespan.SPANNING_UNTIL_RUNDOWN_END', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).toContain(PieceLifespan.SPANNING_UNTIL_RUNDOWN_END)
          })

          it('does not call with PieceLifespan.WITHIN_PART', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).not.toContain(PieceLifespan.WITHIN_PART)
          })

          it('does not call with PieceLifespan.SPANNING_UNTIL_SEGMENT_END', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).not.toContain(PieceLifespan.SPANNING_UNTIL_SEGMENT_END)
          })

          it('does not call with PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE)
          })

          it('does not call with PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).not.toContain(PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE)
          })

          it('does not call with PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN', () => {
            const mockPart: Part = EntityMockFactory.createPartMock()
            const part: Part = instance(mockPart)

            const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

            testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())

            const [lifespanFilters] = capture(mockPart.getPiecesWithLifespan).last()
            expect(lifespanFilters).not.toContain(PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN)
          })
        })
      })
    })

    describe('it has two Parts', () => {
      describe('each Part has a Piece on different layers', () => {
        it('returns both Pieces', () => {
          const pieceOne: Piece = EntityMockFactory.createPiece({ id: 'pieceOne', layer: 'someLayer' })
          const partOne: Part = EntityMockFactory.createPart(
            { id: 'partOne', pieces: [pieceOne] },
            { piecesWithLifespanFilters: [pieceOne] }
          )

          const pieceTwo: Piece = EntityMockFactory.createPiece({ id: 'pieceTwo', layer: 'someOtherLayer' })
          const partTwo: Part = EntityMockFactory.createPart(
            { id: 'partTwo', pieces: [pieceTwo] },
            { piecesWithLifespanFilters: [pieceTwo] }
          )

          const testee: Segment = new Segment({ parts: [partOne, partTwo] } as SegmentInterface)

          const result: Piece[] = testee.getFirstSpanningRundownPieceForEachLayerForAllParts(new Set())
          expect(result).toContain(pieceOne)
          expect(result).toContain(pieceTwo)
        })
      })
    })
  })

  describe(Segment.prototype.reset.name, () => {
    it('resets all parts', () => {
      const mockedPart1: Part = EntityMockFactory.createPartMock()
      const mockedPart2: Part = EntityMockFactory.createPartMock()
      const mockedPart3: Part = EntityMockFactory.createPartMock()
      const parts: Part[] = [
        instance(mockedPart1),
        instance(mockedPart2),
        instance(mockedPart3),
      ]
      const testee: Segment = new Segment({ parts } as SegmentInterface)

      testee.reset()

      verify(mockedPart1.reset()).once()
      verify(mockedPart2.reset()).once()
      verify(mockedPart3.reset()).once()
    })

    it('clears executed at epoch time', () => {
      const executedAtEpochTime: number = 1234
      const testee: Segment = new Segment({ executedAtEpochTime } as SegmentInterface)

      expect(testee.getExecutedAtEpochTime()).toBe(executedAtEpochTime)
      testee.reset()

      expect(testee.getExecutedAtEpochTime()).toBeUndefined()
    })
  })

  describe(Segment.prototype.insertPartAfterActivePart.name, () => {
    it('is not the Segment with the active Part - throws exception', () => {
      const randomNotActivePart: Part = new Part({ isOnAir: false } as PartInterface)
      const unplannedPart: Part = new Part({ id: 'unplannedPartId', ingestedPart: undefined } as PartInterface)

      const testee: Segment = new Segment({ parts: [randomNotActivePart] } as SegmentInterface)

      expect(() => testee.insertPartAfterActivePart(unplannedPart)).toThrow()
    })

    it('updates the SegmentId of the Part', () => {
      const randomActivePart: Part = new Part({ isOnAir: true } as PartInterface)
      const unplannedPart: Part = new Part({ id: 'unplannedPartId', ingestedPart: undefined } as PartInterface)

      const testee: Segment = new Segment({ id: 'segmentId', parts: [randomActivePart] } as SegmentInterface)

      testee.insertPartAfterActivePart(unplannedPart)

      expect(unplannedPart.getSegmentId()).toBe(testee.id)
    })

    describe('the active Part is the last Part of the Segment', () => {
      it('inserts the Part as the last entry of the Parts array', () => {
        const randomActivePart: Part = new Part({ isOnAir: true } as PartInterface)
        const unplannedPart: Part = new Part({ id: 'unplannedPartId', ingestedPart: undefined, segmentId: '' } as PartInterface)

        const testee: Segment = new Segment({ parts: [randomActivePart] } as SegmentInterface)

        testee.insertPartAfterActivePart(unplannedPart)

        const lastPartOfSegment: Part = testee.getParts()[testee.getParts().length - 1]
        expect(lastPartOfSegment).toBe(unplannedPart)
      })
    })

    describe('the active Part is not the last Part of the Segment', () => {
      describe('the Part after the active Part is an unplanned Part', () => {
        it('replaces the "old" unplanned Part', () => {
          const randomActivePart: Part = new Part({ isOnAir: true } as PartInterface)
          const unplannedPartAfterActivePart: Part = new Part({ id: 'oldUnplannedPartId', isOnAir: false, ingestedPart: undefined } as PartInterface)
          const unplannedPartToBeInserted: Part = new Part({ id: 'unplannedPartId', ingestedPart: undefined, segmentId: '' } as PartInterface)

          const testee: Segment = new Segment({ parts: [randomActivePart, unplannedPartAfterActivePart] } as SegmentInterface)

          const indexOfOldUnplannedPart: number = testee.getParts().findIndex(part => part.id === unplannedPartAfterActivePart.id)

          testee.insertPartAfterActivePart(unplannedPartToBeInserted)

          expect(testee.getParts()).not.toContain(unplannedPartAfterActivePart)
          expect(testee.getParts()).toContain(unplannedPartToBeInserted)
          expect(testee.getParts()[indexOfOldUnplannedPart]).toBe(unplannedPartToBeInserted)
        })
      })

      describe('the Part after the active Part is a planned Part', () => {
        it('inserts the unplanned Part after the active Part and before the planned Part', () => {
          const randomActivePart: Part = new Part({ isOnAir: true } as PartInterface)
          const plannedPartAfterActivePart: Part = new Part({ id: 'plannedPartId', isOnAir: false, ingestedPart: {} } as PartInterface)
          const partToBeInserted: Part = new Part({ id: 'unplannedPartId', ingestedPart: undefined, segmentId: '' } as PartInterface)

          const testee: Segment = new Segment({ parts: [randomActivePart, plannedPartAfterActivePart] } as SegmentInterface)

          const indexOfPlannedPart: number = testee.getParts().findIndex(part => part.id === plannedPartAfterActivePart.id)

          testee.insertPartAfterActivePart(partToBeInserted)

          expect(testee.getParts()).toContain(plannedPartAfterActivePart)
          expect(testee.getParts()).toContain(partToBeInserted)
          expect(testee.getParts()[indexOfPlannedPart]).toBe(partToBeInserted)
        })
      })
    })
  })

  describe(Segment.prototype.markAsUnsynced.name, () => {
    it('marks the Segment as unsynced', () => {
      const testee: Segment = new Segment({ isUnsynced: false } as SegmentInterface)
      expect(testee.isUnsynced()).toBeFalsy()
      testee.markAsUnsynced()
      expect(testee.isUnsynced()).toBeTruthy()
    })

    it('sets the rank to be one lower than the original rank', () => {
      const rank: number = 500
      const testee: Segment = new Segment({ rank } as SegmentInterface)
      testee.markAsUnsynced()
      expect(testee.rank).toBe(rank - 1)
    })

    it('marks all of its Parts as unsynced', () => {
      const partOne: Part = EntityMockFactory.createPartMock({ id: '1' } as PartInterface)
      const partTwo: Part = EntityMockFactory.createPartMock({ id: '2' } as PartInterface)
      const partThree: Part = EntityMockFactory.createPartMock({ id: '3' } as PartInterface)

      const parts: Part[] = [instance(partOne), instance(partTwo), instance(partThree)]

      const testee: Segment = new Segment({ parts } as SegmentInterface)
      testee.markAsUnsynced()

      verify(partOne.markAsUnsyncedWithUnsyncedSegment()).once()
      verify(partTwo.markAsUnsyncedWithUnsyncedSegment()).once()
      verify(partThree.markAsUnsyncedWithUnsyncedSegment()).once()
    })

    describe('it does not have any Parts on Air', () => {
      it('sets its Parts to be an empty array', () => {
        const partOne: Part = EntityTestFactory.createPart({ id: '1', isOnAir: false } as PartInterface)
        const partTwo: Part = EntityTestFactory.createPart({ id: '2', isOnAir: false } as PartInterface)
        const partThree: Part = EntityTestFactory.createPart({ id: '3', isOnAir: false } as PartInterface)

        const parts: Part[] = [partOne, partTwo, partThree]

        const testee: Segment = new Segment({ parts } as SegmentInterface)
        testee.markAsUnsynced()

        expect(testee.getParts()).toHaveLength(0)
      })
    })

    describe('it has a Part on Air', () => {
      it('gets an unsynced copy of the active Part', () => {
        const partOnAir: Part = EntityTestFactory.createPart({ id: '1', isOnAir: true } as PartInterface)
        const partTwo: Part = EntityTestFactory.createPart({ id: '2', isOnAir: false } as PartInterface)
        const partThree: Part = EntityTestFactory.createPart({ id: '3', isOnAir: false } as PartInterface)

        const parts: Part[] = [partOnAir, partTwo, partThree]

        const testee: Segment = new Segment({ parts } as SegmentInterface)
        testee.markAsUnsynced()

        expect(testee.getParts()[0].id).toContain(UNSYNCED_ID_POSTFIX)
      })

      it('only have the Part on Air in its Parts array', () => {
        const partOnAir: Part = EntityTestFactory.createPart({ id: '1', isOnAir: true } as PartInterface)
        const partTwo: Part = EntityTestFactory.createPart({ id: '2', isOnAir: false } as PartInterface)
        const partThree: Part = EntityTestFactory.createPart({ id: '3', isOnAir: false } as PartInterface)

        const parts: Part[] = [partOnAir, partTwo, partThree]

        const testee: Segment = new Segment({ parts } as SegmentInterface)
        testee.markAsUnsynced()

        expect(testee.getParts()).toHaveLength(1)
        expect(testee.getParts()[0].isOnAir()).toBeTruthy()
      })
    })
  })

  describe(Segment.prototype.removeUnsyncedParts.name, () => {
    describe('it has no unsynced Parts', () => {
      it('does not alter the Parts array', () => {
        const partOne: Part = EntityTestFactory.createPart({ id: '1', isUnsynced: false } as PartInterface)
        const partTwo: Part = EntityTestFactory.createPart({ id: '2', isUnsynced: false } as PartInterface)
        const partThree: Part = EntityTestFactory.createPart({ id: '3', isUnsynced: false } as PartInterface)
        const parts: Part[] = [partOne, partTwo, partThree]

        const testee: Segment = new Segment({ parts} as SegmentInterface)
        testee.removeUnsyncedParts()

        expect(testee.getParts()).toHaveLength(parts.length)
        expect(testee.getParts()).toEqual(parts)
      })
    })

    describe('it has unsynced Parts', () => {
      it('filters away the unsynced Parts from the Part array', () => {
        const partOne: Part = EntityTestFactory.createPart({ id: '1', isUnsynced: true } as PartInterface)
        const partTwo: Part = EntityTestFactory.createPart({ id: '2', isUnsynced: false } as PartInterface)
        const partThree: Part = EntityTestFactory.createPart({ id: '3', isUnsynced: true } as PartInterface)
        const parts: Part[] = [partOne, partTwo, partThree]

        const testee: Segment = new Segment({ parts} as SegmentInterface)
        testee.removeUnsyncedParts()

        expect(testee.getParts()).toHaveLength(1)
        expect(testee.getParts()).toContain(partTwo)
      })
    })
  })

  describe(Segment.prototype.addPart.name, () => {
    describe('the Segment is unsynced', () => {
      describe('the Part is on Air', () => {
        it('adds the Part', () => {
          const onAirPart: Part = new Part({ isOnAir: true } as PartInterface)
          const testee: Segment = new Segment({ isUnsynced: true } as SegmentInterface)

          expect(testee.getParts()).toHaveLength(0)
          testee.addPart(onAirPart)
          expect(testee.getParts()).toHaveLength(1)
          expect(testee.getParts()).toContain(onAirPart)
        })
      })

      describe('the Part is not on Air', () => {
        it('does not add the Part', () => {
          const offAirPart: Part = new Part({ isOnAir: false } as PartInterface)
          const testee: Segment = new Segment({ isUnsynced: true } as SegmentInterface)

          expect(testee.getParts()).toHaveLength(0)
          testee.addPart(offAirPart)
          expect(testee.getParts()).toHaveLength(0)
        })
      })
    })

    describe('the Part already exist on the Segment', () => {
      it('throws an AlreadyExistException', () => {
        const part: Part = new Part({ id: 'somePartId' } as PartInterface)
        const testee: Segment = new Segment({ parts: [part] } as SegmentInterface)

        expect(() => testee.addPart(part)).toThrow(AlreadyExistException)
      })
    })

    describe('the Part does not exist on the Segment', () => {
      it('adds the Part to the Segment', () => {
        const part: Part = new Part({ id: 'somePartId' } as PartInterface)
        const testee: Segment = new Segment({ } as SegmentInterface)

        expect(testee.getParts()).not.toContain(part)
        testee.addPart(part)
        expect(testee.getParts()).toContain(part)
      })

      it('sorts the Parts according to rank', () => {
        const partOne: Part = new Part({ id: '1', rank: 1 } as PartInterface)
        const partTwo: Part = new Part({ id: '2', rank: 10 } as PartInterface)

        const partToBeInserted: Part = new Part({ id: '3', rank: 5 } as PartInterface)

        const testee: Segment = new Segment({ parts: [partOne, partTwo] } as SegmentInterface)

        testee.addPart(partToBeInserted)

        expect(testee.getParts()[0].getRank()).toBe(partOne.getRank())
        expect(testee.getParts()[1].getRank()).toBe(partToBeInserted.getRank())
        expect(testee.getParts()[2].getRank()).toBe(partTwo.getRank())
      })
    })
  })

  describe(Segment.prototype.updatePart.name, () => {
    describe('Part does not exist on Segment', () => {
      it('throws NotFound exception', () => {
        const nonExistingPartOnSegment: Part = EntityTestFactory.createPart()
        const testee: Segment = new Segment({ } as SegmentInterface)

        expect(() => testee.updatePart(nonExistingPartOnSegment)).toThrow(NotFoundException)
      })
    })

    describe('Part does exist on Segment', () => {
      it('updates the existing Part with the new Part', () => {
        const partId: string = 'partId'
        const oldPart: Part = EntityTestFactory.createPart({ id: partId })
        const newPart: Part = EntityTestFactory.createPart({ id: partId })

        const testee: Segment = new Segment({ parts: [oldPart] } as SegmentInterface)

        expect(testee.getParts()).toHaveLength(1)
        expect(testee.getParts()).toContain(oldPart)

        testee.updatePart(newPart)

        expect(testee.getParts()).toHaveLength(1)
        expect(testee.getParts()).toContain(newPart)
      })

      it('sorts Parts according to rank', () => {
        const partId: string = 'partId'
        const oldPart: Part = EntityTestFactory.createPart({ id: partId, rank: 1 })
        const partTwo: Part = EntityTestFactory.createPart({ id: partId, rank: 5 })
        const partThree: Part = EntityTestFactory.createPart({ id: partId, rank: 10 })

        const newPart: Part = EntityTestFactory.createPart({ id: partId, rank: 20 })

        const testee: Segment = new Segment({ parts: [oldPart, partTwo, partThree] } as SegmentInterface)

        expect(testee.getParts()[0]).toBe(oldPart)
        expect(testee.getParts()[1]).toBe(partTwo)
        expect(testee.getParts()[2]).toBe(partThree)

        testee.updatePart(newPart)

        expect(testee.getParts()[0]).toBe(partTwo)
        expect(testee.getParts()[1]).toBe(partThree)
        expect(testee.getParts()[2]).toBe(newPart)

      })
    })
  })

  describe(Segment.prototype.removePart.name, () => {
    describe('Part does not exist on Segment', () => {
      it('does not remove any Parts', () => {
        const nonExistingPartId: string = 'nonExistingPartId'
        const somePart: Part = EntityTestFactory.createPart({ id: 'somePartId'})

        const testee: Segment = new Segment({ parts: [somePart]} as SegmentInterface)

        expect(testee.getParts()).toHaveLength(1)
        testee.removePart(nonExistingPartId)
        expect(testee.getParts()).toHaveLength(1)
      })
    })

    describe('Part exist on Segment', () => {
      describe('Part is on Air', () => {
        it('mark the Part as unsynced', () => {
          const partId: string = 'somePartId'
          const somePart: Part = EntityMockFactory.createPartMock({ id: partId, isOnAir: true})
          const testee: Segment = new Segment({ parts: [instance(somePart)]} as SegmentInterface)

          testee.removePart(partId)
          verify(somePart.markAsUnsynced()).once()
        })

        it('does not remove the Part', () => {
          const somePart: Part = EntityTestFactory.createPart({ id: 'somePartId', isOnAir: true})
          const testee: Segment = new Segment({ parts: [somePart]} as SegmentInterface)

          expect(testee.getParts()).toHaveLength(1)
          testee.removePart(somePart.id)
          expect(testee.getParts()).toHaveLength(1)
        })
      })

      describe('Part is not on Air', () => {
        it('removes the Part', () => {
          const somePart: Part = EntityTestFactory.createPart({ id: 'somePartId', isOnAir: false})
          const testee: Segment = new Segment({ parts: [somePart]} as SegmentInterface)

          expect(testee.getParts()).toHaveLength(1)
          testee.removePart(somePart.id)
          expect(testee.getParts()).toHaveLength(0)
        })
      })
    })
  })

  describe(Segment.prototype.findNextPart.name, () => {
    describe('when the from part is the last part in the segment', () => {
      it('throws a last part in segment exception', () => {
        const fromPart: Part = EntityTestFactory.createPart({ id: 'from-part' })
        const testee: Segment = EntityTestFactory.createSegment({ parts: [fromPart] })

        const result: () => Part = () => testee.findNextPart(fromPart)

        expect(result).toThrow(LastPartInSegmentException)
      })
    })

    describe('when part is last valid part in segment', () => {
      it('throws a last part in segment exception', () => {
        const fromPart: Part = EntityTestFactory.createPart({ id: 'from-part' })
        const invalidPart: Part = EntityTestFactory.createPart({ invalidity: { reason: 'some reason' }})
        const testee: Segment = EntityTestFactory.createSegment({ parts: [fromPart, invalidPart] })

        const result: () => Part = () => testee.findNextPart(fromPart)

        expect(result).toThrow(LastPartInSegmentException)
      })
    })

    describe('when part is followed by an invalid part', () => {
      it('skips the invalid part', () => {
        const fromPart: Part = EntityTestFactory.createPart({ id: 'from-part' })
        const invalidPart: Part = EntityTestFactory.createPart({ invalidity: { reason: 'some reason' }})
        const nextValidPart: Part = EntityTestFactory.createPart({ id: 'next-valid-part' })
        const testee: Segment = EntityTestFactory.createSegment({ parts: [fromPart, invalidPart, nextValidPart] })

        const result: Part = testee.findNextPart(fromPart)

        expect(result).toBe(nextValidPart)
      })
    })
  })
})
