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

        const newIngestedPiece: IngestedPiece = {
          id: 'newIngestedPiece',
          name: 'New Ingested Piece'
        } as IngestedPiece
        const ingestedPart: IngestedPart = {
          ingestedPieces: [newIngestedPiece] as Readonly<IngestedPiece[]>
        } as IngestedPart

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
  })
})
