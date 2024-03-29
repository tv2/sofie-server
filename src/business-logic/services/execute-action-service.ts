import { ActionService } from './interfaces/action-service'
import {
  Action,
  ActionManifest,
  MutateActionMethods,
  MutateActionType,
  MutateActionWithArgumentsMethods,
  MutateActionWithHistoricPartMethods,
  MutateActionWithMedia,
  MutateActionWithPieceMethods,
  PartAction,
  PieceAction
} from '../../model/entities/action'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { PartActionType, PieceActionType } from '../../model/enums/action-type'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { RundownService } from './interfaces/rundown-service'
import { Part, PartInterface } from '../../model/entities/part'
import { Piece, PieceInterface } from '../../model/entities/piece'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { ActionManifestRepository } from '../../data-access/repositories/interfaces/action-manifest-repository'
import { MediaRepository } from '../../data-access/repositories/interfaces/MediaRepository'
import { Media } from '../../model/entities/media'

export class ExecuteActionService implements ActionService {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly actionRepository: ActionRepository,
    private readonly actionManifestRepository: ActionManifestRepository,
    private readonly rundownRepository: RundownRepository,
    private readonly mediaRepository: MediaRepository,
    private readonly rundownService: RundownService,
    private readonly blueprint: Blueprint
  ) {}

  /**
   * Fetches all Actions that are not associated with a Rundown
   */
  public async getActions(): Promise<Action[]> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    // TODO: The Actions should be generated on ingest. Move them once we control ingest.
    const actions: Action[] = this.blueprint.generateActions(configuration, [])
    await this.actionRepository.saveActions(actions)
    return actions
  }

  /**
   * Fetches all Actions that are not associated with a Rundown plus all Rundown specific Actions for the parsed RundownId
   */
  public async getActionsForRundown(rundownId: string): Promise<Action[]> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actionManifests: ActionManifest[] = await this.actionManifestRepository.getActionManifests(rundownId)
    // TODO: The Actions should be generated on ingest. Move them once we control ingest.
    const actions: Action[] = this.blueprint.generateActions(configuration, actionManifests)
    await this.actionRepository.deleteActionsForRundown(rundownId)
    await this.actionRepository.saveActions(actions)
    return actions
  }

  public async executeAction(actionId: string, rundownId: string, actionArguments?: unknown): Promise<void> {
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
        await this.insertPieceAsNext(pieceAction, rundownId)
        await this.rundownService.takeNext(rundownId)
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

  private async mutateAction(action: Action, rundownId: string, actionArguments: unknown): Promise<Action> {
    const mutateActionMethodsArray: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)
    if (!mutateActionMethodsArray) {
      return action
    }

    for (let i = 0; i < mutateActionMethodsArray.length; i++) {
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

  private async insertPartAsOnAir(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction)
    await this.rundownService.insertPartAsOnAir(rundownId, part)
  }

  private createPartFromAction(partAction: PartAction): Part {
    const partInterface: PartInterface = partAction.data.partInterface
    partInterface.metadata = { actionId: partAction.id }
    partInterface.id = this.makeUnique(partInterface.id)

    partInterface.pieces = partAction.data.pieceInterfaces.map(pieceInterface => new Piece({
      ...pieceInterface,
      partId: partInterface.id
    }))

    return new Part(partInterface)
  }

  private makeUnique(value: string): string {
    return `${value}_${Date.now()}`
  }

  private async insertPartAsNext(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction)
    await this.rundownService.insertPartAsNext(rundownId, part)
  }

  private async insertPieceAsOnAir(pieceAction: PieceAction, rundownId: string): Promise<void> {
    const piece: Piece = this.createPieceFromAction(pieceAction)
    piece.setExecutedAt(Date.now())
    await this.rundownService.insertPieceAsOnAir(rundownId, piece, pieceAction.data.layersToStopPiecesOn)
  }

  private createPieceFromAction(pieceAction: PieceAction): Piece {
    const pieceInterface: PieceInterface = pieceAction.data.pieceInterface
    pieceInterface.id = this.makeUnique(pieceInterface.id)
    return new Piece(pieceInterface)
  }

  private async insertPieceAsNext(pieceAction: PieceAction, rundownId: string): Promise<void> {
    const piece: Piece = this.createPieceFromAction(pieceAction)
    await this.rundownService.insertPieceAsNext(rundownId, piece, pieceAction.data.partInTransition)
  }

  private async replacePiece(action: Action, rundownId: string, actionArguments: unknown): Promise<void> {
    const mutateActionMethodsArray: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)

    let pieceFromRundown: Piece | undefined

    for (let i = 0; i < mutateActionMethodsArray.length; i++) {
      const mutateActionMethods: MutateActionMethods = mutateActionMethodsArray[i]
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

    const piece: Piece = this.createPieceFromAction(action as PieceAction)
    await this.rundownService.replacePieceOnAirOnNextPart(rundownId, pieceFromRundown, piece)
  }
}
