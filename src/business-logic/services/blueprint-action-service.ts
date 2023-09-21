import { ActionService } from './interfaces/action-service'
import { Action, InsertPartAction } from '../../model/entities/action'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { ActionType } from '../../model/enums/action-type'
import { UnsupportedOperation } from '../../model/exceptions/unsupported-operation'
import { RundownService } from './interfaces/rundown-service'
import { Part, PartInterface } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'

export class BlueprintActionService implements ActionService {
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
        const insertPartAction: InsertPartAction = action as InsertPartAction
        await this.executeInsertPartAction(insertPartAction, rundownId)
        break
      }
      case ActionType.INSERT_PIECE:
      default: {
        throw new UnsupportedOperation(`ActionType ${action.type} is not yet supported/implemented`)
      }
    }
  }

  private async executeInsertPartAction(insertPartAction: InsertPartAction, rundownId: string): Promise<void> {
    const pieces: Piece[] = insertPartAction.data.pieceInterfaces.map(pieceInterface => new Piece(pieceInterface))

    const partInterface: PartInterface = insertPartAction.data.partInterface
    partInterface.id = `${partInterface.id}_${Date.now()}`
    partInterface.pieces = pieces

    const part: Part = new Part(partInterface)
    await this.rundownService.insertPart(rundownId, part)
  }
}
