import { ExecuteActionService } from '../execute-action-service'
import { Action, PartAction, PieceAction } from '../../../model/entities/action'
import { PartActionType, PieceActionType } from '../../../model/enums/action-type'
import { Part, PartInterface } from '../../../model/entities/part'
import { ConfigurationRepository } from '../../../data-access/repositories/interfaces/configuration-repository'
import { ActionRepository } from '../../../data-access/repositories/interfaces/action-repository'
import { RundownService } from '../interfaces/rundown-service'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { Blueprint } from '../../../model/value-objects/blueprint'
import { anyOfClass, anyString, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Piece, PieceInterface } from '../../../model/entities/piece'

describe(ExecuteActionService.name, () => {
  describe(`${ExecuteActionService.prototype.executeAction.name}`, () => {
    describe('it receives an InsertPartAsOnAirAction', () => {
      it('calls RundownService.insertPartAsOnAir', async () => {
        const action: PartAction = createPartAction(PartActionType.INSERT_PART_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownServiceMock.insertPartAsOnAir(anyString(), anyOfClass(Part))).once()
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
    })

    describe('it receives an InsertPieceAsOnAirAction', () => {
      beforeEach(() => jest.useFakeTimers())
      afterEach(() => jest.useRealTimers())
      it('calls RundownService.insertPieceAsOnAir', async () => {
        const action: PieceAction = createPieceAction(PieceActionType.INSERT_PIECE_AS_ON_AIR)
        const rundownServiceMock: RundownService = mock<RundownService>()

        const testee: ExecuteActionService = createTestee({rundownService: rundownServiceMock}, {action})
        await testee.executeAction(action.id, 'rundownId')

        verify(rundownServiceMock.insertPieceAsOnAir(anyString(), anyOfClass(Piece))).once()
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

        verify(rundownServiceMock.insertPieceAsNext(anyString(), anyOfClass(Piece))).once()
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
  })
})

function createPartAction(actionType: PartActionType): PartAction {
  return {
    id: 'actionId',
    name: 'someAction',
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
    type: actionType,
    data: {
      id: 'pieceId'
    } as PieceInterface
  }
}


function createTestee(
  params?: {
    configurationRepository?: ConfigurationRepository,
    actionRepository?: ActionRepository,
    rundownService?: RundownService,
    rundownRepository?: RundownRepository,
    blueprint?: Blueprint
  },
  misc?: {
    action?: Action
  }
): ExecuteActionService {
  const configurationRepository: ConfigurationRepository = params?.configurationRepository ?? mock<ConfigurationRepository>()
  const actionRepository: ActionRepository = params?.actionRepository ?? mock<ActionRepository>()
  const rundownService: RundownService = params?.rundownService ?? mock<RundownService>()
  const rundownRepository: RundownRepository = params?.rundownRepository ?? mock<RundownRepository>()
  const blueprint: Blueprint = params?.blueprint ?? mock<Blueprint>()

  if (misc?.action) {
    when(actionRepository.getAction(misc.action.id)).thenReturn(Promise.resolve(misc.action))
  }

  return new ExecuteActionService(
    instance(configurationRepository),
    instance(actionRepository),
    instance(rundownService),
    instance(rundownRepository),
    instance(blueprint)
  )
}
