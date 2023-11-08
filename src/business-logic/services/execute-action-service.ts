import { ActionService } from './interfaces/action-service'
import {
  Action,
  ActionManifest,
  MutateActionMethods,
  MutateActionType,
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
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
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

  public async getActions(): Promise<Action[]> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    // TODO: Only fetch ActionManifest for a given Rundown
    const actionManifest: ActionManifest[] = await this.actionManifestRepository.getActionManifests()
    // TODO: The Actions should be generated on ingest. Move them once we control ingest.
    const actions: Action[] = this.blueprint.generateActions(configuration, actionManifest)
    await this.actionRepository.saveActions(actions)
    return actions
  }

  public async executeAction(actionId: string, rundownId: string): Promise<void> {
    const action: Action = await this.actionRepository.getAction(actionId)
    switch (action.type) {
      case PartActionType.INSERT_PART_AS_ON_AIR: {
        const partAction: PartAction = (await this.mutateAction(action, rundownId)) as PartAction
        await this.insertPartAsOnAir(partAction, rundownId)
        break
      }
      case PartActionType.INSERT_PART_AS_NEXT: {
        const partAction: PartAction = (await this.mutateAction(action, rundownId)) as PartAction
        await this.insertPartAsNext(partAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_ON_AIR: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId)) as PieceAction
        await this.insertPieceAsOnAir(pieceAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId)) as PieceAction
        await this.insertPieceAsNext(pieceAction, rundownId)
        break
      }
      case PieceActionType.INSERT_PIECE_AS_NEXT_AND_TAKE: {
        const pieceAction: PieceAction = (await this.mutateAction(action, rundownId)) as PieceAction
        await this.insertPieceAsNext(pieceAction, rundownId)
        await this.rundownService.takeNext(rundownId)
        break
      }
      case PieceActionType.REPLACE_PIECE: {
        await this.replacePiece(action, rundownId)
        break
      }
      default: {
        throw new UnsupportedOperation(`ActionType ${action.type} is not yet supported/implemented`)
      }
    }
  }

  private async mutateAction(action: Action, rundownId: string): Promise<Action> {
    const mutateActionMethodsArray: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)
    if (!mutateActionMethodsArray) {
      return action
    }

    for (let i = 0; i < mutateActionMethodsArray.length; i++) {
      const mutateActionMethods: MutateActionMethods = mutateActionMethodsArray[i]
      action = await this.executeMutateActionMethods(action, mutateActionMethods, rundownId)
    }

    return action
  }

  private async executeMutateActionMethods(action: Action, mutateActionMethods: MutateActionMethods, rundownId: string): Promise<Action> {
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
    const media: Media | undefined = await this.mediaRepository.getMedia(mutateActionMethods.getMediaId())
    return mutateActionMethods.updateActionWithMedia(action, media)
  }

  private async mutateActionWithHistoricPart(rundownId: string, mutateActionMethods: MutateActionWithHistoricPartMethods, action: Action): Promise<Action> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const historicPart: Part = rundown.findPartInHistory(mutateActionMethods.partPredicate)
    const presentPart: Part | undefined = rundown.getPart(historicPart.id)

    return mutateActionMethods.updateActionWithPartData(action, historicPart, presentPart)
  }

  private async insertPartAsOnAir(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction)
    await this.rundownService.insertPartAsOnAir(rundownId, part)
  }

  private createPartFromAction(partAction: PartAction): Part {
    const partInterface: PartInterface = partAction.data.partInterface
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
    await this.rundownService.insertPieceAsOnAir(rundownId, piece)
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

  private async replacePiece(action: Action, rundownId: string): Promise<void> {
    const mutateActionMethodsArray: MutateActionMethods[] = this.getMutateActionsMethodsFromAction(action)

    let pieceFromRundown: Piece | undefined

    for (let i = 0; i < mutateActionMethodsArray.length; i++) {
      const mutateActionMethods: MutateActionMethods = mutateActionMethodsArray[i]
      if (mutateActionMethods.type !== MutateActionType.PIECE) {
        action = await this.executeMutateActionMethods(action, mutateActionMethods, rundownId)
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
