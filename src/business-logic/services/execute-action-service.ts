import { ActionService } from './interfaces/action-service'
import { Action, PartAction } from '../../model/entities/action'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { ActionType } from '../../model/enums/action-type'
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
import { RundownService } from './interfaces/rundown-service'
import { Part, PartInterface } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'

export class ExecuteActionService implements ActionService {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly actionRepository: ActionRepository,
    private readonly rundownService: RundownService,
    private readonly blueprint: Blueprint
  ) {}

  public async getActions(): Promise<Action[]> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    // TODO: These should be generated on ingest. Move them once we control ingest.
    const actions: Action[] = this.blueprint.generateActions(configuration)
    await this.actionRepository.saveActions(actions)
    return actions
  }

  public async executeAction(actionId: string, rundownId: string): Promise<void> {
    const action: Action = await this.actionRepository.getAction(actionId)
    switch (action.type) {
      case ActionType.INSERT_PART: {
        const partAction: PartAction = action as PartAction
        await this.executeInsertPartAction(partAction, rundownId)
        break
      }
      case ActionType.INSERT_AND_TAKE_PART: {
        const partAction: PartAction = action as PartAction
        await this.executeInsertAndTakePartAction(partAction, rundownId)
        break
      }
      case ActionType.INSERT_PIECE:
      default: {
        throw new UnsupportedOperation(`ActionType ${action.type} is not yet supported/implemented`)
      }
    }
  }

  private async executeInsertPartAction(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction)
    await this.rundownService.insertPart(rundownId, part)
  }

  private createPartFromAction(partAction: PartAction): Part {
    const pieces: Piece[] = partAction.data.pieceInterfaces.map(pieceInterface => new Piece(pieceInterface))

    const partInterface: PartInterface = partAction.data.partInterface
    partInterface.id = `${partInterface.id}_${Date.now()}`
    partInterface.pieces = pieces

    return new Part(partInterface)
  }

  private async executeInsertAndTakePartAction(partAction: PartAction, rundownId: string): Promise<void> {
    const part: Part = this.createPartFromAction(partAction)
    await this.rundownService.insertAndTakePart(rundownId, part)
  }
}
