import { Rundown } from '../../../rundown-execution/domain/entities/rundown'
import { Configuration } from '../../../rundown-execution/domain/entities/configuration'
import { Action, ActionManifest } from '../../domain/entities/action'
import { ConfigurationRepository } from '../../../rundown-execution/domain/repositories/configuration-repository'
import { ActionManifestRepository } from '../../domain/repositories/action-manifest-repository'
import { Blueprint } from '../../../rundown-execution/domain/value-objects/blueprint'
import { ActionRepository } from '../../domain/repositories/action-repository'
import { ActionEventEmitter } from '../interfaces/action-event-emitter'

// TODO: This should have a interface that other modules can depend on.
export class ActionGenerationService {
  public constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly actionManifestRepository: ActionManifestRepository,
    private readonly actionRepository: ActionRepository,
    private readonly actionEventEmitter: ActionEventEmitter,
    private readonly blueprint: Blueprint,
  ) {}

  public async generateActionsForRundown(rundown: Rundown): Promise<void> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actionManifests: ActionManifest[] = await this.actionManifestRepository.getActionManifests(rundown.id)
    const actions: Action[] = this.blueprint.generateActions(configuration, rundown.getShowStyleVariantId(), actionManifests)
    this.actionEventEmitter.emitActionsUpdatedEvent(actions, rundown.id)

    await this.actionRepository.deleteActionsForRundown(rundown.id)
    await this.actionRepository.saveActions(actions)
  }

  public async generateActionsForSystem(): Promise<void> {
    const nonExistingShowStyleVariantId: string = 'nonExistingShowStyleVariantId'
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actions: Action[] = this.blueprint.generateActions(configuration, nonExistingShowStyleVariantId, [])
    this.actionEventEmitter.emitActionsUpdatedEvent(actions)

    await this.actionRepository.deleteActionsNotOnRundowns()
    await this.actionRepository.saveActions(actions)
  }

  public async removeActionsForRundown(rundownId: string): Promise<void> {
    await this.actionRepository.deleteActionsForRundown(rundownId)
    this.actionEventEmitter.emitActionsUpdatedEvent([], rundownId)
  }
}
