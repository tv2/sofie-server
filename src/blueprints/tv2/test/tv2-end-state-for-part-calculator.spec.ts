import { Tv2EndStateForPartCalculator } from '../tv2-end-state-for-part-calculator'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Tv2TallyTags } from '../value-objects/tv2-tally-tags'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { Tv2SisyfosPersistentLayerFinder } from '../helpers/tv2-sisyfos-persistent-layer-finder'
import { capture, instance, mock } from '@typestrong/ts-mockito'
import { Tv2PartEndState } from '../value-objects/tv2-part-end-state'
import { Tv2RundownPersistentState } from '../value-objects/tv2-rundown-persistent-state'

describe(`${Tv2EndStateForPartCalculator.name}`, () => {
  describe(`${Tv2EndStateForPartCalculator.prototype.getEndStateForPart.name}`, () => {
    describe('Part has Piece with JingleIsLive tag', () => {
      it('sets isJingle to true', () => {
        const pieceWithJingleTag: Piece = EntityMockFactory.createPiece({ tags: [Tv2TallyTags.JINGLE_IS_LIVE] })
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithJingleTag] })

        const testee: Tv2EndStateForPartCalculator = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0, undefined) as Tv2PartEndState

        expect(result.isJingle).toBeTruthy()
      })
    })

    describe('Part has no Pieces with JingleIsLive tag', () => {
      it('sets isJingle to false', () => {
        const pieceWithoutJingleTag: Piece = EntityMockFactory.createPiece()
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithoutJingleTag] })

        const testee: Tv2EndStateForPartCalculator = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0, undefined) as Tv2PartEndState

        expect(result.isJingle).toBeFalsy()
      })
    })

    describe('Part has Piece with FullIsLive tag', () => {
      it('sets fullFileName to fileName from Piece', () => {
        const fileName: string = 'someFilename'
        const pieceWithFileName: Piece = EntityMockFactory.createPiece({ tags: [Tv2TallyTags.FULL_IS_LIVE], content: { fileName } })
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithFileName] })

        const testee: Tv2EndStateForPartCalculator = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0, undefined) as Tv2PartEndState

        expect(result.fullFileName).toBe(fileName)
      })
    })

    describe('Part has no Pieces with FullIsLive tag', () => {
      it('does not set fullFileName', () => {
        const pieceWithoutFileName: Piece = EntityMockFactory.createPiece()
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithoutFileName] })

        const testee: Tv2EndStateForPartCalculator = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0, undefined) as Tv2PartEndState

        expect(result.fullFileName).toBeFalsy()
      })
    })

    describe('it finds sisyfos layers to be persisted', () => {
      describe('Segment is a new Segment', () => {
        it('calls sisyfosPersistentLayerFinder with an empty array', () =>  {
          const part: Part = EntityMockFactory.createPart({ id: 'active' })
          const previousPartEndState: Tv2PartEndState = {
            sisyfosPersistenceMetadata: {
              sisyfosLayers: ['someLayer']
            }
          }
          const previousPart: Part = EntityMockFactory.createPart({ id: 'previous', endState: previousPartEndState })
          const persistentState: Tv2RundownPersistentState = {
            isNewSegment: true,
            activeMediaPlayerSessions: []
          }

          const sisyfosPersistentLayerFinderMock: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)

          const testee: Tv2EndStateForPartCalculator = createTestee({ sisyfosPersistentLayerFinder: instance(sisyfosPersistentLayerFinderMock) })
          testee.getEndStateForPart(part, previousPart, 0, persistentState)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_part, _previousPart, layers, ] = capture(sisyfosPersistentLayerFinderMock.findLayersToPersist).last()
          expect(layers).toHaveLength(0)
        })
      })

      describe('there is no previous Part end state', () => {
        it('calls sisyfosPersistentLayerFinder with an empty array', () =>  {
          const part: Part = EntityMockFactory.createPart()
          const persistentState: Tv2RundownPersistentState = {
            isNewSegment: false,
            activeMediaPlayerSessions: []
          }

          const sisyfosPersistentLayerFinderMock: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)

          const testee: Tv2EndStateForPartCalculator = createTestee({ sisyfosPersistentLayerFinder: instance(sisyfosPersistentLayerFinderMock) })
          testee.getEndStateForPart(part, undefined, 0, persistentState)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_part, _previousPart, layers, ] = capture(sisyfosPersistentLayerFinderMock.findLayersToPersist).last()
          expect(layers).toHaveLength(0)
        })
      })

      describe('there is a previous Part end state, but with no sisyfos layers', () => {
        it('calls sisyfosPersistentLayerFinder with an empty array', () =>  {
          const part: Part = EntityMockFactory.createPart({ id: 'active' })
          const previousPart: Part = EntityMockFactory.createPart({ id: 'previous' })
          const persistentState: Tv2RundownPersistentState = {
            isNewSegment: false,
            activeMediaPlayerSessions: []
          }

          const sisyfosPersistentLayerFinderMock: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)

          const testee: Tv2EndStateForPartCalculator = createTestee({ sisyfosPersistentLayerFinder: instance(sisyfosPersistentLayerFinderMock) })
          testee.getEndStateForPart(part, previousPart, 0, persistentState)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_part, _previousPart, layers, ] = capture(sisyfosPersistentLayerFinderMock.findLayersToPersist).last()
          expect(layers).toHaveLength(0)
        })
      })

      describe('Segment is not a new Segment and there is a previous Part end state with sisyfos layers', () => {
        it('calls sisyfosPersistentLayerFinder with the sisyfos layers of the previous Part end state', () =>  {
          const part: Part = EntityMockFactory.createPart({ id: 'active' })
          const sisyfosLayers: string[] = ['someLayer']
          const previousPartEndState: Tv2PartEndState = {
            sisyfosPersistenceMetadata: {
              sisyfosLayers
            }
          }
          const previousPart: Part = EntityMockFactory.createPart({ id: 'previous', endState: previousPartEndState })
          const persistentState: Tv2RundownPersistentState = {
            isNewSegment: false,
            activeMediaPlayerSessions: []
          }

          const sisyfosPersistentLayerFinderMock: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)

          const testee: Tv2EndStateForPartCalculator = createTestee({ sisyfosPersistentLayerFinder: instance(sisyfosPersistentLayerFinderMock) })
          testee.getEndStateForPart(part, previousPart, 0, persistentState)

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_part, _previousPart, layers, ] = capture(sisyfosPersistentLayerFinderMock.findLayersToPersist).last()
          expect(layers).toBe(sisyfosLayers)
        })
      })
    })
  })
})

function createTestee(params?: {
  sisyfosPersistentLayerFinder?: Tv2SisyfosPersistentLayerFinder
}): Tv2EndStateForPartCalculator {
  const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = params?.sisyfosPersistentLayerFinder ?? instance(mock(Tv2SisyfosPersistentLayerFinder))
  return  new Tv2EndStateForPartCalculator(sisyfosPersistentLayerFinder)
}
