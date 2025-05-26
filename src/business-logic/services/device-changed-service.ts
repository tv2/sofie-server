import { DataChangeService } from './interfaces/data-change-service'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { StatusMessage } from '../../model/entities/status-message'
import { StatusCode } from '../../model/enums/status-code'
import { Logger } from '../../logger/logger'
import { StatusMessageService } from './interfaces/status-message-service'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { CoreDeviceConfiguration } from '../../model/entities/device-configuration'
import { DeviceConfigurationRepository } from '../../data-access/repositories/interfaces/device-configuration-repository'
import { DeviceType } from '../../model/enums/device-type'

// TODO: Find a way to translate
const NOT_CONNECTED_MESSAGE: string = 'Not connected'

const DEVICE_STATUS_MESSAGE_PREFIX: string = 'DEVICE_'

export class DeviceChangedService implements DataChangeService {
  private static instance: DataChangeService

  public static getInstance(
    statusMessageService: StatusMessageService,
    deviceRepository: DeviceConfigurationRepository,
    deviceChangedListener: DataChangedListener<CoreDeviceConfiguration>,
    logger: Logger
  ): DataChangeService {
    if (!this.instance) {
      this.instance = new DeviceChangedService(
        statusMessageService,
        deviceRepository,
        deviceChangedListener,
        logger
      )
    }
    return this.instance
  }

  private readonly logger: Logger

  constructor(
    private readonly statusMessageService: StatusMessageService,
    private readonly deviceRepository: DeviceConfigurationRepository,
    deviceChangedListener: DataChangedListener<CoreDeviceConfiguration>,
    logger: Logger
  ) {
    this.logger = logger.tag(DeviceChangedService.name)
    this.updateStatusMessageFromCurrentDeviceStatus()
      .catch((error) => this.logger.data(error).error('Unable to update status messages from current devices'))
    this.listenForStatusMessageChanges(deviceChangedListener)
  }

  public initialize(): Promise<void> {
    throw new UnsupportedOperationException('Not implemented')
  }

  private async updateStatusMessageFromCurrentDeviceStatus(): Promise<void> {
    const devices: CoreDeviceConfiguration[] = await this.deviceRepository.getDeviceConfigurations() as unknown as CoreDeviceConfiguration[]
    await Promise.all(devices.map(device => this.onDeviceUpdated(device)))

    const statusMessagesForDevices: StatusMessage[] = devices.map(device => this.convertDeviceConfigurationToStatusMessage(device))
    await this.statusMessageService.deleteStatusMessagesWithIdPrefixNotInCollection(DEVICE_STATUS_MESSAGE_PREFIX, statusMessagesForDevices)
  }

  private listenForStatusMessageChanges(deviceChangedListener: DataChangedListener<CoreDeviceConfiguration>): void {
    deviceChangedListener.onCreated(device => {
      this.onDeviceUpdated(device).catch(error => this.logger.data(error).error(`Failed processing device created event for device '${device.name}' with id '${device.id}'.`))
    })
    deviceChangedListener.onUpdated(device => {
      this.onDeviceUpdated(device).catch(error => this.logger.data(error).error(`Failed processing device updated event for device '${device.name}' with id '${device.id}'.`))
    })
    deviceChangedListener.onDeleted(deviceId => {
      this.onDeviceDeleted(deviceId).catch(error => this.logger.data(error).error(`Failed processing device deleted event for device ${deviceId}`))
    })
  }

  private async onDeviceUpdated(deviceConfiguration: CoreDeviceConfiguration): Promise<void> {
    if (!deviceConfiguration.isConnected) {
      deviceConfiguration.statusCode = StatusCode.BAD
      deviceConfiguration.statusMessage = NOT_CONNECTED_MESSAGE
    }

    await this.statusMessageService.updateStatusMessage(this.convertDeviceConfigurationToStatusMessage(deviceConfiguration))
  }

  private convertDeviceConfigurationToStatusMessage(deviceConfiguration: CoreDeviceConfiguration): StatusMessage {
    return {
      id: `${DEVICE_STATUS_MESSAGE_PREFIX}${deviceConfiguration.id}`,
      statusCode: deviceConfiguration.statusCode,
      title: deviceConfiguration.name,
      message: this.getDeviceConfigurationMessage(deviceConfiguration)
    }
  }

  private getDeviceConfigurationMessage(deviceConfiguration: CoreDeviceConfiguration): string {
    if (deviceConfiguration.statusMessage) {
      return deviceConfiguration.statusMessage
    }
    if (deviceConfiguration.statusCode === StatusCode.GOOD) {
      return 'The device is in a good state.'
    }
    return ''
  }

  private async onDeviceDeleted(deviceConfigurationId: string): Promise<void> {
    const deletedDeviceConfiguration: CoreDeviceConfiguration = {
      id: deviceConfigurationId,
      name: '',
      statusMessage: 'Device was deleted',
      statusCode: StatusCode.GOOD,
      isConnected: false,
      type: DeviceType.ABSTRACT
    }

    await this.statusMessageService.updateStatusMessage(this.convertDeviceConfigurationToStatusMessage(deletedDeviceConfiguration))
  }
}
