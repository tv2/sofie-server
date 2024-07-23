import { ExecuteActionService } from '../execute-action-service'
import {
  Action,
  MutateActionType,
  MutateActionWithPieceMethods,
  PartAction,
  PieceAction
} from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Part, PartInterface } from '../../../model/entities/part'
import { ActionRepository } from '../../../data-access/repositories/interfaces/action-repository'
import { RundownService } from '../interfaces/rundown-service'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { Blueprint } from '../../../model/value-objects/blueprint'
import { anyOfClass, anyString, anything, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Piece, PieceInterface } from '../../../model/entities/piece'
import { MediaRepository } from '../../../data-access/repositories/interfaces/MediaRepository'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Rundown } from '../../../model/entities/rundown'
import { Owner } from '../../../model/enums/owner'
import { RundownMode } from '../../../model/enums/rundown-mode'

describe(ExecuteActionService.name, () => {
  describe(`${ExecuteActionService.prototype.executeAction.name}`, () => {
    describe('it receives an InsertPartAsOnAirAction', () => {
      it('calls RundownService.insertPartAsOnAir', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_ON_AIR)
        const rundownService: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({ rundownService }, { action })
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownService.insertPartAsOnAir(anyString(), anyOfClass(Part))).once()
      })

      it('updates Part id to be unique', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({ rundownService: rundownServiceMock }, {action})
        // Executes the same Action twice. Verifies that the two generated Parts from the same Action does not have the same id.
        await testee.executeAction(action.id, 'rundownId')
        await testee.executeAction(action.id, 'rundownId')

        const [, firstExecutedPart] = capture(rundownServiceMock.insertPartAsOnAir).first()
        const [, lastExecutedPart] = capture(rundownServiceMock.insertPartAsOnAir).last()

        expect(firstExecutedPart.id).not.toBe(lastExecutedPart.id)
      })

      it('adds the ActionId to the metadata of the Part', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_ON_AIR)
        const rundownService: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({ rundownService }, { action })
        await testee.executeAction(action.id, 'rundownId')

        const [, part] = capture(rundownService.insertPartAsOnAir).last()
        expect(part.metadata?.actionId).toBe(action.id)
      })
    })

    describe('it receives an InsertPartAsNextAction', () => {
      it('calls RundownService.insertPartAsNext', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_NEXT)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownServiceMock.insertPartAsNext(anyString(), anyOfClass(Part))).once()
      })

      it('updates Part id to be unique', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_NEXT)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        // Executes the same Action twice. Verifies that the two generated Parts from the same Action does not have the same id.
        await testee.executeAction(action.id, 'rundownId')
        await testee.executeAction(action.id, 'rundownId')

        const [, firstExecutedPart] = capture(rundownServiceMock.insertPartAsNext).first()
        const [, lastExecutedPart] = capture(rundownServiceMock.insertPartAsNext).last()

        expect(firstExecutedPart.id).not.toBe(lastExecutedPart.id)
      })

      it('adds the ActionId to the metadata of the Part', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_NEXT)
        const rundownService: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({ rundownService }, { action })
        await testee.executeAction(action.id, 'rundownId')

        const [, part] = capture(rundownService.insertPartAsNext).last()
        expect(part.metadata?.actionId).toBe(action.id)
      })
    })

    describe('it receives an InsertPieceAsOnAirAction', () => {
      beforeEach(() => jest.useFakeTimers())
      afterEach(() => jest.useRealTimers())
      it('calls RundownService.insertPieceAsOnAir', async () => {
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownServiceMock.insertPieceAsOnAir(anyString(), anyOfClass(Piece), anything())).once()
      })

      it('updates Piece id to be unique', async () => {
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        // Executes the same Action twice. Verifies that the two generated Pieces from the same Action does not have the same id.
        await testee.executeAction(action.id, 'rundownId')
        await testee.executeAction(action.id, 'rundownId')

        const [, firstExecutedPiece] = capture(rundownServiceMock.insertPieceAsOnAir).first()
        const [, lastExecutedPiece] = capture(rundownServiceMock.insertPieceAsOnAir).last()

        expect(firstExecutedPiece.id).not.toBe(lastExecutedPiece.id)
      })

      it('updates Piece ExecutedAt to be set', async () => {
        const now = Date.now()
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        const [, executedPiece] = capture(rundownServiceMock.insertPieceAsOnAir).first()

        expect(executedPiece.getExecutedAt()).toBe(now)
      })
    })

    describe('it receives an InsertPieceAsNextAction', () => {
      it('calls RundownService.insertPieceAsNext', async () => {
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_NEXT)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownServiceMock.insertPieceAsNext(anyString(), anyOfClass(Piece), anything())).once()
      })

      it('updates Piece id to be unique', async () => {
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_NEXT)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        // Executes the same Action twice. Verifies that the two generated Pieces from the same Action does not have the same id.
        await testee.executeAction(action.id, 'rundownId')
        await testee.executeAction(action.id, 'rundownId')

        const [, firstExecutedPiece] = capture(rundownServiceMock.insertPieceAsNext).first()
        const [, lastExecutedPiece] = capture(rundownServiceMock.insertPieceAsNext).last()

        expect(firstExecutedPiece.id).not.toBe(lastExecutedPiece.id)
      })
    })

    describe('it receives an ReplacePieceAction', () => {
      describe('it finds a matching Piece in the Active Part', () => {
        it('replaces the Piece in the Active Part', async () => {
          const rundownService: RundownService = mock<RundownService>()

          const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
          const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
          const rundown: Rundown = EntityTestFactory.createRundown({
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment: EntityTestFactory.createSegment(),
                part: activePart,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                segment: EntityTestFactory.createSegment(),
                part: EntityTestFactory.createPart(),
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          })

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const action: PieceAction = createPieceAction(PieceActionType.REPLACE_PIECE)

          const mutateActionMethods: MutateActionWithPieceMethods = {
            type: MutateActionType.PIECE,
            updateActionWithPiece: (action) => action,
            piecePredicate: (piece) => piece.id === activePiece.id
          }

          const blueprint: Blueprint = mock<Blueprint>()
          if (!blueprint.getMutateActionMethods) {
            throw new Error('Needed to make blueprint.getMutateActionMethods stub work...')
          }

          when(blueprint.getMutateActionMethods(action)).thenReturn([mutateActionMethods])

          const testee: ExecuteActionService = createTestee(
            {
              rundownService,
              blueprint,
              rundownRepository
            },
            {
              action
            }
          )

          await testee.executeAction(action.id, rundown.id)

          verify(rundownService.replacePieceOnAirOnNextPart(rundown.id, activePiece, anything())).once()
        })
      })

      describe('it finds a matching Piece in the Next Part', () => {
        it('replaces the Piece in the Next Part', async () => {
          const rundownService: RundownService = mock<RundownService>()

          const nextPiece: Piece = EntityTestFactory.createPiece({id: 'nextPiece'})
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart', pieces: [nextPiece]})
          const rundown: Rundown = EntityTestFactory.createRundown({
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment: EntityTestFactory.createSegment(),
                part: EntityTestFactory.createPart(),
                owner: Owner.SYSTEM
              },
              nextCursor: {
                segment: EntityTestFactory.createSegment(),
                part: nextPart,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          })

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const action: PieceAction = createPieceAction(PieceActionType.REPLACE_PIECE)

          const mutateActionMethods: MutateActionWithPieceMethods = {
            type: MutateActionType.PIECE,
            updateActionWithPiece: (action) => action,
            piecePredicate: (piece) => piece.id === nextPiece.id
          }

          const blueprint: Blueprint = mock<Blueprint>()
          if (!blueprint.getMutateActionMethods) {
            throw new Error('Needed to make blueprint.getMutateActionMethods stub work...')
          }

          when(blueprint.getMutateActionMethods(action)).thenReturn([mutateActionMethods])

          const testee: ExecuteActionService = createTestee(
            {
              rundownService,
              blueprint,
              rundownRepository
            },
            {
              action
            }
          )

          await testee.executeAction(action.id, rundown.id)

          verify(rundownService.replacePieceOnAirOnNextPart(rundown.id, nextPiece, anything())).once()
        })
      })

      describe('it finds a matching Piece in both the Active and Next Part', () => {
        it('only replaces the Piece in the Active Part', async () => {
          const rundownService: RundownService = mock<RundownService>()

          const name: string = 'nameToIdentifyMultiplePieces'

          const activePiece: Piece = EntityTestFactory.createPiece({id: 'activePiece', name})
          const activePart: Part = EntityTestFactory.createPart({id: 'activePart', pieces: [activePiece]})

          const nextPiece: Piece = EntityTestFactory.createPiece({id: 'nextPiece', name})
          const nextPart: Part = EntityTestFactory.createPart({id: 'nextPart', pieces: [nextPiece]})

          const rundown: Rundown = EntityTestFactory.createRundown({
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: {
                segment: EntityTestFactory.createSegment(),
                part: activePart,
                owner: Owner.SYSTEM
              },
              nextCursor: {
                segment: EntityTestFactory.createSegment(),
                part: nextPart,
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          })

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const action: PieceAction = createPieceAction(PieceActionType.REPLACE_PIECE)

          const mutateActionMethods: MutateActionWithPieceMethods = {
            type: MutateActionType.PIECE,
            updateActionWithPiece: (action) => action,
            piecePredicate: (piece) => piece.name === name
          }

          const blueprint: Blueprint = mock<Blueprint>()
          if (!blueprint.getMutateActionMethods) {
            throw new Error('Needed to make blueprint.getMutateActionMethods stub work...')
          }

          when(blueprint.getMutateActionMethods(action)).thenReturn([mutateActionMethods])

          const testee: ExecuteActionService = createTestee(
            {
              rundownService,
              blueprint,
              rundownRepository
            },
            {
              action
            }
          )

          await testee.executeAction(action.id, rundown.id)

          verify(rundownService.replacePieceOnAirOnNextPart(rundown.id, activePiece, anything())).once()
        })
      })
    })
  })
})

function createPartAction(actionType: PartActionType): PartAction {
  return {
    id: 'actionId',
    name: 'someAction',
    rank: 0,
    type: actionType,
    data: {
      partInterface: {
        id: 'partId'
      } as PartInterface,
      pieceInterfaces: []
    }
  }
}

function createPieceAction(actionType: PieceActionType): PieceAction {
  return {
    id: 'actionId',
    name: 'someAction',
    rank: 0,
    type: actionType,
    data: {
      pieceInterface: {
        id: 'pieceId'
      } as PieceInterface
    }
  }
}


function createTestee(
  params?: {
    actionRepository?: ActionRepository,
    rundownRepository?: RundownRepository,
    mediaRepository?: MediaRepository
    rundownService?: RundownService,
    blueprint?: Blueprint
  },
  misc?: {
    action?: Action
  }
): ExecuteActionService {
  const actionRepository: ActionRepository = params?.actionRepository ?? mock<ActionRepository>()
  const rundownRepository: RundownRepository = params?.rundownRepository ?? mock<RundownRepository>()
  const mediaRepository: MediaRepository = params?.mediaRepository ?? mock<MediaRepository>()
  const rundownService: RundownService = params?.rundownService ?? mock<RundownService>()
  const blueprint: Blueprint = params?.blueprint ?? mock<Blueprint>()

  if (misc?.action) {
    when(actionRepository.getAction(misc.action.id)).thenReturn(Promise.resolve(misc.action))
  }

  return new ExecuteActionService(
    instance(actionRepository),
    instance(rundownRepository),
    instance(mediaRepository),
    instance(rundownService),
    instance(blueprint)
  )
}
