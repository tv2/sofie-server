import { ActionService } from './interfaces/action-service'
import {
  Action,
  MutateActionMethods,
  MutateActionType,
  MutateActionWithArgumentsMethods,
  MutateActionWithConfiguration,
  MutateActionWithHistoricPartMethods,
  MutateActionWithMedia,
  MutateActionWithPieceMethods,
  MutateActionWithPlayoutContent,
  PartAction,
  PieceAction,
  SystemAction,
  SystemActionId
} from '../../rundown-execution/domain/entities/action'
import { Blueprint } from '../../rundown-execution/domain/value-objects/blueprint'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { PartActionType, PieceActionType, SystemActionType } from '../../rundown-execution/domain/enums/action-type'
import { UnsupportedOperationException } from '../../rundown-execution/domain/exceptions/unsupported-operation-exception'
import { RundownService } from './interfaces/rundown-service'
import { Part, PartInterface } from '../../rundown-execution/domain/entities/part'
import { Piece, PieceInterface } from '../../rundown-execution/domain/entities/piece'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../rundown-execution/domain/entities/rundown'
import { MediaRepository } from '../../data-access/repositories/interfaces/media-repository'
import { Media } from '../../rundown-execution/domain/entities/media'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../rundown-execution/domain/entities/configuration'
import { SetNextDirection } from '../../rundown-execution/domain/enums/set-next-direction'
import { TakeMode } from '../../rundown-execution/domain/enums/take-mode'
import { PlayoutContentType } from '../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../rundown-execution/domain/enums/output-channel'
import { PlayoutContentReadService } from './interfaces/playout-content-service'
import { PlayoutContent } from '../../rundown-execution/domain/value-objects/playout-content'

const SYSTEM_ACTIONS_ID: string = 'SYSTEM_ACTIONS_ID'

const SYSTEM_ACTIONS: SystemAction[] = [
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.TAKE,
    name: 'Take',
    description: 'Executes a Take',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.RESET_RUNDOWN,
    name: 'Reset Rundown',
    description: 'Executes a Reset',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.ACTIVATE_RUNDOWN,
    name: 'Activate Rundown',
    description: 'Activates the Rundown',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.DEACTIVATE_RUNDOWN,
    name: 'Deactivate Rundown',
    description: 'Deactivates the Rundown',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_NEXT_PART,
    name: 'Set next Part',
    description: 'Sets the Part after the next Part as next',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_PREVIOUS_PART,
    name: 'Set previous Part',
    description: 'Sets the Part before the next Part as next',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_NEXT_SEGMENT,
    name: 'Set next Segment',
    description: 'Sets the the Segment after the next Segment as next',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_PREVIOUS_SEGMENT,
    name: 'Set previous Segment',
    description: 'Sets the Segment before the next Segment as next',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_TAKE_MODE_STANDARD,
    name: 'Set Take Mode Standard',
    description: 'Sets the Take mode to Standard behavior',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
  {
    type: SystemActionType.SYSTEM_ACTION,
    id: SystemActionId.SET_TAKE_MODE_RECALL,
    name: 'Set Take Mode Recall',
    description: 'Sets the Take mode to Recall behavior',
    rank: 0,
    data: undefined,
    metadata: {
      playoutContent: {
        type: PlayoutContentType.UNKNOWN
      },
      outputChannel: OutputChannel.UNKNOWN
    }
  },
]

export class ExecuteActionService implements ActionService {
  constructor(
    private readonly actionRepository: ActionRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly rundownService: RundownService,
    private readonly blueprint: Blueprint,
    private readonly playoutContentService: PlayoutContentReadService
  ) {}

  public async getActionsForRundown(rundownId :string): Promise<Action[]> {
    return [
      ...rundownId === SYSTEM_ACTIONS_ID ? SYSTEM_ACTIONS : [],
      ...await this.actionRepository.getActionsForRundown(rundownId)
    ]
  }

  public async getSystemActions(): Promise<Action[]> {
    return [
      ...SYSTEM_ACTIONS,
      ...await this.actionRepository.getSystemActions()
    ]
  }

  public async executeAction(actionId: string, rundownId: string, actionArguments?: unknown): Promise<void> {
    if (Object.values(SystemActionId).includes(actionId as SystemActionId)) {
      await this.executeSystemAction(actionId as SystemActionId, rundownId)
      return
    }
    const action: Action = await this.actionRepository.getAction(actionId)
    switch (action.type) {
      case PartActionType.INSERT_PART_AS_ON_AIR: {
        const partAction: PartAction = (await this.mutateAction(action, rundownId, actionArguments)) as PartAction
        await this.insertPartAsOnAir(partAction, rundownId)
        break
      }
      case PartActionType.INSERT_PART_AS_NEXT: {
        const partAction: PartAction = (await this.mutateAction(action, rundownId, actionArguments)) as PartAction
        await this.insertPartAsNext(partAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_ON_AIR: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId, actionArguments)) as PieceAction
        await this.insertPieceAsOnAir(pieceAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId, actionArguments)) as PieceAction
        await this.insertPieceAsNext(pieceAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId, actionArguments)) as PieceAction
        await this.insertPieceAsNextAndTake(pieceAction, rundownId)
        break
      }
      case PieceActionType.REPLACE_PIECE: {
        await this.replacePiece(action, rundownId, actionArguments)
        break
      }
      default: {
        throw new UnsupportedOperationException(`ActionType ${action.type} is not yet supported/implemented`)
      }
    }
  }

  private async executeSystemAction(systemActionId: SystemActionId, rundownId: string): Promise<void> {
    switch (systemActionId) {
      case SystemActionId.TAKE: {
        await this.rundownService.takeNext(rundownId)
        break
      }
      case SystemActionId.RESET_RUNDOWN: {
        await this.rundownService.resetRundown(rundownId)
        break
      }
      case SystemActionId.ACTIVATE_RUNDOWN: {
        await this.rundownService.activateRundown(rundownId)
        break
      }
      case SystemActionId.DEACTIVATE_RUNDOWN: {
        await this.rundownService.deactivateRundown(rundownId)
        break
      }
      case SystemActionId.SET_NEXT_PART: {
        await this.rundownService.setNextFromDirection(rundownId, SetNextDirection.PART_AFTER_NEXT_PART)
        break
      }
      case SystemActionId.SET_PREVIOUS_PART: {
        await this.rundownService.setNextFromDirection(rundownId, SetNextDirection.PART_BEFORE_NEXT_PART)
        break
      }
      case SystemActionId.SET_NEXT_SEGMENT: {
        await this.rundownService.setNextFromDirection(rundownId, SetNextDirection.SEGMENT_AFTER_NEXT_SEGMENT)
        break
      }
      case SystemActionId.SET_PREVIOUS_SEGMENT: {
        await this.rundownService.setNextFromDirection(rundownId, SetNextDirection.SEGMENT_BEFORE_NEXT_SEGMENT)
        break
      }
      case SystemActionId.SET_TAKE_MODE_STANDARD: {
        await this.rundownService.setTakeMode(rundownId, TakeMode.STANDARD)
        break
      }
      case SystemActionId.SET_TAKE_MODE_RECALL: {
        await this.rundownService.setTakeMode(rundownId, TakeMode.RECALL)
        break
      }
    }
  }

  private async mutateAction(action: Action, rundownId: string, actionArguments: unknown): Promise<Action> {
    const mutateActionMethodsArray: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)
    if (!mutateActionMethodsArray) {
      return action
    }

    for (let i: number = 0; i < mutateActionMethodsArray.length; i++) {
      const mutateActionMethods: MutateActionMethods = mutateActionMethodsArray[i]
      action = await this.executeMutateActionMethods(action, mutateActionMethods, rundownId, actionArguments)
    }

    return action
  }

  private async executeMutateActionMethods(action: Action, mutateActionMethods: MutateActionMethods, rundownId: string, actionArguments: unknown): Promise<Action> {
    switch (mutateActionMethods.type) {
      case MutateActionType.PIECE: {
        return await this.mutateActionWithPieceFromNextPart(rundownId, mutateActionMethods, action)
      }
      case MutateActionType.MEDIA: {
        return this.mutateActionWithMedia(mutateActionMethods, action)
      }
      case MutateActionType.HISTORIC_PART: {
        return this.mutateActionWithHistoricPart(rundownId, mutateActionMethods, action)
      }
      case MutateActionType.APPLY_ARGUMENTS: {
        return this.mutateActionWithArgument(mutateActionMethods, action, actionArguments)
      }
      case MutateActionType.CONFIGURATION: {
        return this.mutateActionWithConfiguration(mutateActionMethods, action, rundownId)
      }
      case MutateActionType.PLAYOUT_CONTENT: {
        return this.mutateActionWithPlayoutContent(mutateActionMethods, action)
      }
      default: {
        return action
      }
    }
  }

  private getMutateActionsMethodsFromAction(action: Action): MutateActionMethods[] {
    if (!this.blueprint.getMutateActionMethods) {
      return []
    }
    return this.blueprint.getMutateActionMethods(action)
  }

  private async mutateActionWithPieceFromNextPart(rundownId: string, mutateActionMethods: MutateActionWithPieceMethods, action: Action): Promise<Action> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const piece: Piece | undefined = rundown.getNextPart().getPieces().find(mutateActionMethods.piecePredicate)
    if (!piece) {
      return action
    }
    return mutateActionMethods.updateActionWithPiece(action, piece)
  }

  private async mutateActionWithMedia(mutateActionMethods: MutateActionWithMedia, action: Action): Promise<Action> {
    const media: Media | undefined = await this.mediaRepository.getMediaBySourceName(mutateActionMethods.getMediaSourceName())
    return mutateActionMethods.updateActionWithMedia(action, media)
  }

  private async mutateActionWithHistoricPart(rundownId: string, mutateActionMethods: MutateActionWithHistoricPartMethods, action: Action): Promise<Action> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const historicPart: Part = rundown.findPartInHistory(mutateActionMethods.partPredicate)
    const presentPart: Part | undefined = rundown.getPart(historicPart.id)

    return mutateActionMethods.updateActionWithPartData(action, historicPart, presentPart)
  }

  private mutateActionWithArgument(mutateActionsMethods: MutateActionWithArgumentsMethods, action: Action, actionArguments: unknown): Action {
    return mutateActionsMethods.updateActionWithArguments(action, actionArguments)
  }

  private async mutateActionWithConfiguration(mutateActionsMethods: MutateActionWithConfiguration, action: Action, rundownId: string): Promise<Action> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    return mutateActionsMethods.updateWithConfiguration(action, configuration, rundown.getShowStyleVariantId())
  }

  private mutateActionWithPlayoutContent(mutateActionMethods: MutateActionWithPlayoutContent, action: Action): Action {
    const playoutContent: PlayoutContent | undefined = this.playoutContentService.getProgramPlayoutContentState().find(playoutContent => mutateActionMethods.playoutContentPredicate(playoutContent))
    ?? this.playoutContentService.getPreviewPlayoutContentState().find(playoutContent => mutateActionMethods.playoutContentPredicate(playoutContent))

    if (!playoutContent) {
      return action
    }

    return mutateActionMethods.updateActionWithPlayoutContent(action, playoutContent)
  }

  private async insertPartAsOnAir(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction, rundownId)
    await this.rundownService.insertPartAsOnAir(rundownId, part)
  }

  private createPartFromAction(partAction: PartAction, rundownId: string): Part {
    const partInterface: PartInterface = partAction.data.partInterface
    partInterface.metadata = { actionId: partAction.id }
    partInterface.id = this.makeUnique(partInterface.id)
    partInterface.rundownId = rundownId

    partInterface.pieces = partAction.data.pieceInterfaces.map(pieceInterface => new Piece({
      ...pieceInterface,
      id: this.makeUnique(pieceInterface.id),
      partId: partInterface.id,
      rundownId: partInterface.rundownId,
    }))

    return new Part(partInterface)
  }

  private makeUnique(value: string): string {
    return `${value}_${Date.now()}`
  }

  private async insertPartAsNext(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction, rundownId)
    await this.rundownService.insertPartAsNext(rundownId, part)
  }

  private async insertPieceAsOnAir(pieceAction: PieceAction, rundownId: string): Promise<void> {
    const piece: Piece = this.createPieceFromAction(pieceAction, rundownId)
    piece.putOnAir(Date.now())
    await this.rundownService.insertPieceAsOnAir(rundownId, piece, pieceAction.data.layersToStopPiecesOn)
  }

  private createPieceFromAction(pieceAction: PieceAction, rundownId: string): Piece {
    const pieceInterface: PieceInterface = pieceAction.data.pieceInterface
    pieceInterface.id = this.makeUnique(pieceInterface.id)
    pieceInterface.rundownId = rundownId
    pieceInterface.createdFromActionId = pieceAction.id
    return new Piece(pieceInterface)
  }

  private async insertPieceAsNext(pieceAction: PieceAction, rundownId: string): Promise<void> {
    const piece: Piece = this.createPieceFromAction(pieceAction, rundownId)
    await this.rundownService.insertPieceAsNext(rundownId, piece, pieceAction.data.partInTransition)
  }

  private async insertPieceAsNextAndTake(pieceAction: PieceAction, rundownId: string): Promise<void> {
    const piece: Piece = this.createPieceFromAction(pieceAction, rundownId)
    await this.rundownService.insertPieceAsNextAndTake(rundownId, piece, pieceAction.data.partInTransition)
  }

  private async replacePiece(action: Action, rundownId: string, actionArguments: unknown): Promise<void> {
    const mutateActionMethodsSequence: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)

    let pieceFromRundown: Piece | undefined

    for (let i: number = 0; i < mutateActionMethodsSequence.length; i++) {
      const mutateActionMethods: MutateActionMethods = mutateActionMethodsSequence[i]
      if (mutateActionMethods.type !== MutateActionType.PIECE) {
        action = await this.executeMutateActionMethods(action, mutateActionMethods, rundownId, actionArguments)
        continue
      }

      const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
      pieceFromRundown = rundown.getActivePart().getPieces().find(mutateActionMethods.piecePredicate)
        ?? rundown.getNextPart().getPieces().find(mutateActionMethods.piecePredicate)

      if (!pieceFromRundown) {
        continue
      }

      action = mutateActionMethods.updateActionWithPiece(action, pieceFromRundown)
    }

    if (!pieceFromRundown) {
      return
    }

    const piece: Piece = this.createPieceFromAction(action as PieceAction, rundownId)
    await this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceFromRundown, piece)
  }
}
