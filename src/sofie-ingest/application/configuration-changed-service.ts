import { DataChangeService } from '../../rundown-execution/application/data-change-service'
import { DataChangedListener } from '../../cross-cutting-concerns/application/data-changed-listener'
import { ShowStyle } from '../../rundown-execution/domain/entities/show-style'
import { Blueprint } from '../../rundown-execution/domain/value-objects/blueprint'
import { StatusMessage } from '../../rundown-execution/domain/entities/status-message'
import { ConfigurationRepository } from '../../rundown-execution/domain/repositories/configuration-repository'
import { Configuration } from '../../rundown-execution/domain/entities/configuration'
import { StatusMessageService } from '../../business-logic/services/interfaces/status-message-service'
import { Logger } from '../../cross-cutting-concerns/application/logger'
import { UnsupportedOperationException } from '../../rundown-execution/domain/exceptions/unsupported-operation-exception'
import { ShowStyleVariant } from '../../rundown-execution/domain/entities/show-style-variant'

const CONFIGURATION_STATUS_MESSAGE_ID_PREFIX: string = 'INVALID_CONFIGURATION_'

export class ConfigurationChangedService implements DataChangeService {

  private static instance: DataChangeService

  public static getInstance(
    blueprint: Blueprint,
    statusMessageService: StatusMessageService,
    configurationRepository: ConfigurationRepository,
    showStyleConfigurationChangedListener: DataChangedListener<ShowStyle>,
    showStyleVariantConfigurationChangedListener: DataChangedListener<ShowStyleVariant>,
    logger: Logger
  ): DataChangeService {
    if (!this.instance) {
      this.instance = new ConfigurationChangedService(
        blueprint,
        statusMessageService,
        configurationRepository,
        showStyleConfigurationChangedListener,
        showStyleVariantConfigurationChangedListener,
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
    showStyleVariantConfigurationChangedListener: DataChangedListener<ShowStyleVariant>,
    logger: Logger
  ) {
    this.logger = logger.tag(ConfigurationChangedService.name)
    this.validateConfiguration().catch(error => this.logger.data(error).error('Failed to validate configuration'))
    this.validateConfigurationOnChange(showStyleConfigurationChangedListener)
    this.validateConfigurationOnChange(showStyleVariantConfigurationChangedListener)
  }

  public initialize(): Promise<void> {
    throw new UnsupportedOperationException('Not implemented')
  }

  private validateConfigurationOnChange<T>(dataChangedListener: DataChangedListener<T>): void {
    dataChangedListener.onUpdated(() => {
      this.validateConfiguration().catch(error => this.logger.data(error).error('Failed to validate configuration'))
    })
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
