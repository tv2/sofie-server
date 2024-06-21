import { DataChangeService } from './interfaces/data-change-service'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { ShowStyle } from '../../model/entities/show-style'
import { Blueprint } from '../../model/value-objects/blueprint'
import { StatusMessage } from '../../model/entities/status-message'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { StatusMessageService } from './interfaces/status-message-service'
import { Logger } from '../../logger/logger'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'

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
