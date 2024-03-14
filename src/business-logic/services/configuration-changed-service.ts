import { DataChangeService } from './interfaces/data-change-service'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { ShowStyle } from '../../model/entities/show-style'
import { Blueprint } from '../../model/value-objects/blueprint'
import { StatusMessage } from '../../model/entities/status-message'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { StatusMessageService } from './interfaces/status-message-service'
import { Logger } from '../../logger/logger'

const CONFIGURATION_STATUS_MESSAGE_ID_PREFIX: string = 'INVALID_CONFIGURATION_'

export class ConfigurationChangedService implements DataChangeService {

  private static instance: DataChangeService

  public static getInstance(
    blueprint: Blueprint,
    statusMessageService: StatusMessageService,
    configurationRepository: ConfigurationRepository,
    showStyleConfigurationChangedListener: DataChangedListener<ShowStyle>,
    logger: Logger
  ): DataChangeService {
    if (!this.instance) {
      this.instance = new ConfigurationChangedService(
        blueprint,
        statusMessageService,
        configurationRepository,
        showStyleConfigurationChangedListener,
        logger
      )
    }
    return this.instance
  }

  private readonly logger: Logger

  private constructor(
    private readonly blueprint: Blueprint,
    private readonly statusMessageService: StatusMessageService,
    private readonly configurationRepository: ConfigurationRepository,
    showStyleConfigurationChangedListener: DataChangedListener<ShowStyle>,
    logger: Logger
  ) {
    this.logger = logger.tag(ConfigurationChangedService.name)
    this.callAgainOnError(() => this.validateConfiguration())
    this.listenForShowStyleChanges(showStyleConfigurationChangedListener)
  }

  private callAgainOnError(callback: () => Promise<void>, attemptNumber: number = 1): void {
    const maxAttempts: number = 10
    callback().catch((error) => {
      if (attemptNumber >= maxAttempts){
        this.logger.debug(`Unable to successfully call method on ${attemptNumber} attempts. Stopping recursive function`)
        this.logger.error(error)
        return
      }
      setTimeout(() => {
        this.callAgainOnError(callback, ++attemptNumber)
      }, 1000)
    })
  }

  private listenForShowStyleChanges(showStyleConfigurationChangedListener: DataChangedListener<ShowStyle>): void {
    showStyleConfigurationChangedListener.onUpdated(() => void this.validateConfiguration())
  }

  private async validateConfiguration(): Promise<void> {
    this.configurationRepository.clearConfigurationCache()
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const statusMessages: StatusMessage[] = this.blueprint.validateConfiguration(configuration).map(statusMessage => {
      return {
        ...statusMessage,
        id: `${CONFIGURATION_STATUS_MESSAGE_ID_PREFIX}${statusMessage.id}` // We need to prefix the id, so we can differentiate the configuration status messages from other status messages.
      }
    })

    await this.statusMessageService.updateStatusMessages(statusMessages)
    await this.statusMessageService.deleteStatusMessagesWithIdPrefixNotInCollection(CONFIGURATION_STATUS_MESSAGE_ID_PREFIX, statusMessages)
  }
}
