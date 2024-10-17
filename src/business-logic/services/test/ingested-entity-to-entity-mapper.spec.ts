import { IngestedEntityToEntityMapper } from '../ingested-entity-to-entity-mapper'
import { Part } from '../../../model/entities/part'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { IngestedPart } from '../../../model/entities/ingested-part'
import { IngestedPiece } from '../../../model/entities/ingested-piece'

describe(IngestedEntityToEntityMapper.name, () => {
  describe(IngestedEntityToEntityMapper.prototype.updatePartWithIngestedPart.name, () => {
    describe('ingestedPart has Pieces not on the Part to be updated', () => {
      it('adds the Pieces to the Part', () => {
        const partToBeUpdated: Part = EntityTestFactory.createPart()

        const newIngestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ id: 'newIngestedPiece', name: 'New Ingested Piece' })
        const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ ingestedPieces: [newIngestedPiece] })

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        expect(partToBeUpdated.getPieces()).toHaveLength(0)
        const result: Part = testee.updatePartWithIngestedPart(partToBeUpdated, ingestedPart)
        expect(result.getPieces()).toHaveLength(1)
        expect(result.getPieces()[0].id).toBe(newIngestedPiece.id)
      })
    })

    describe('ingestedPart has updated Pieces that is already on the Part to be updated', () => {
      it('updates the Pieces with the new values', () => {
        const pieceId: string = 'somePieceId'
        const oldPieceName: string = 'oldPieceName'
        const partToBeUpdated: Part = EntityTestFactory.createPart({
          pieces: [EntityTestFactory.createPiece({ id: pieceId, name: oldPieceName})]
        })

        const newPieceName: string = 'newPieceName'
        const updatedPiece: IngestedPiece = {
          id: pieceId,
          name: newPieceName
        } as IngestedPiece
        const ingestedPart: IngestedPart = {
          ingestedPieces: [updatedPiece] as Readonly<IngestedPiece[]>
        } as IngestedPart

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        const result: Part = testee.updatePartWithIngestedPart(partToBeUpdated, ingestedPart)
        expect(result.getPieces().find(piece => piece.name === oldPieceName)).toBeUndefined()
        expect(result.getPieces().find(piece => piece.name === newPieceName)).toBeDefined()
      })
    })

    describe('Part to be updated has Pieces not on the ingestedPart', () => {
      it('removes the Pieces no longer in the IngestedPart from the Part to be updated', () => {
        const partToBeUpdated: Part = EntityTestFactory.createPart({
          pieces: [EntityTestFactory.createPiece()]
        })
        const ingestedPart: IngestedPart = {
          ingestedPieces: [] as Readonly<IngestedPiece[]>
        } as IngestedPart

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        expect(partToBeUpdated.getPieces()).toHaveLength(1)
        const result: Part = testee.updatePartWithIngestedPart(partToBeUpdated, ingestedPart)
        expect(result.getPieces()).toHaveLength(0)
      })
    })

    describe('when the part is on air', () => {
      it('returns the unchanged on air part', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'part-a', name: 'Part A', isOnAir: true })
        const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'Part A (updated)' })

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        const result: Part = testee.updatePartWithIngestedPart(part, ingestedPart)

        expect(part).toStrictEqual(result)
      })
    })
  })

  describe('when the part has unplanned pieces', () => {
    describe('when the ingested part has no overlapping pieces on the same layer', () => {
      it('keeps the unplanned piece', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'part-a', name: 'Part A', pieces: [EntityTestFactory.createPiece({ id: 'unplanned-piece-a', name: 'mix 100', isPlanned: false })] })
        const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'Part A', ingestedPieces: [] })

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        const result: Part = testee.updatePartWithIngestedPart(part, ingestedPart)

        expect(result.getPieces().length).toBe(1)
        expect(result.getPieces()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'mix 100' })]))
      })
    })

    describe('when the ingested part has an overlapping piece on the same layer', () => {
      it('ignores the ingested overlapping piece', () => {
        const part: Part = EntityTestFactory.createPart({ id: 'part-a', name: 'Part A', pieces: [EntityTestFactory.createPiece({ id: 'unplanned-piece-a', name: 'mix 100', layer: 'mix_effect', isPlanned: false })] })
        const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'Part A', ingestedPieces: [EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'mix 50', layer: 'mix_effect' })] })

        const testee: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()

        const result: Part = testee.updatePartWithIngestedPart(part, ingestedPart)

        expect(result.getPieces().length).toBe(1)
        expect(result.getPieces()).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'mix 100' })]))
        expect(result.getPieces()).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'mix 50' })]))
      })
    })
  })
})
