import { Rundown } from '../../rundown-execution/domain/entities/rundown'
import { Configuration } from '../../rundown-execution/domain/entities/configuration'
import { Action, ActionManifest } from '../../rundown-execution/domain/entities/action'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { ActionManifestRepository } from '../../data-access/repositories/interfaces/action-manifest-repository'
import { Blueprint } from '../../rundown-execution/domain/value-objects/blueprint'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { ActionEventEmitter } from './interfaces/action-event-emitter'

export class ActionGenerationService {
  constructor(
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
