import { Rundown } from '../../model/entities/rundown'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest } from '../../model/entities/action'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { ActionManifestRepository } from '../../data-access/repositories/interfaces/action-manifest-repository'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ActionRepository } from '../../data-access/repositories/interfaces/action-repository'
import { ActionEventEmitter } from './interfaces/action-event-emitter'

export class ActionGenerationService {
  constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly actionManifestRepository: ActionManifestRepository,
    private readonly actionRepository: ActionRepository,
    private readonly actionEventEmitter: ActionEventEmitter,
    private readonly blueprint: Blueprint,
  ) {
  }

  public async generateActionsForRundown(rundownId: string): Promise<void> {
    const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const actionManifests: ActionManifest[] = await this.actionManifestRepository.getActionManifests(rundownId)
    const actions: Action[] = this.blueprint.generateActions(configuration, rundown.getShowStyleVariantId(), actionManifests)
    this.actionEventEmitter.emitActionsUpdatedEvent(actions, rundownId)

    await this.actionRepository.deleteActionsForRundown(rundownId)
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
