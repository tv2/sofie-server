import { Tv2EndStateForPartCalculator } from '../tv2-end-state-for-part-calculator'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Tv2TallyTags } from '../value-objects/tv2-tally-tags'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { Tv2SisyfosPersistentLayerFinder } from '../helpers/tv2-sisyfos-persistent-layer-finder'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2PartEndState } from '../value-objects/tv2-part-end-state'

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
  })
})

function createTestee(params?: {
  sisyfosPersistentLayerFinder?: Tv2SisyfosPersistentLayerFinder
}): Tv2EndStateForPartCalculator {
  const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = params?.sisyfosPersistentLayerFinder ?? instance(mock(Tv2SisyfosPersistentLayerFinder))
  return  new Tv2EndStateForPartCalculator(sisyfosPersistentLayerFinder)
}
