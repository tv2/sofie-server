import { DataChangeService } from '../../../rundown-execution/application/interfaces/data-change-service'
import { DataChangedListener } from '../../../cross-cutting-concerns/application/interfaces/data-changed-listener'
import { StatusMessage } from '../../../cross-cutting-concerns/domain/entities/status-message'
import { StatusCode } from '../../../cross-cutting-concerns/domain/enums/status-code'
import { Logger } from '../../../cross-cutting-concerns/application/interfaces/logger'
import { StatusMessageService } from '../../../cross-cutting-concerns/application/interfaces/status-message-service'
import { DeviceRepository } from '../../../rundown-execution/domain/repositories/device-repository'
import { DeviceType } from '../../../rundown-execution/domain/enums/device-type'
import { CoreDevice } from '../../../rundown-execution/domain/entities/device'

// TODO: Find a way to translate
const NOT_CONNECTED_MESSAGE: string = 'Not connected'

const DEVICE_STATUS_MESSAGE_PREFIX: string = 'DEVICE_'

export class DeviceChangedService implements DataChangeService {

  private readonly logger: Logger

  constructor(
    private readonly statusMessageService: StatusMessageService,
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceChangedListener: DataChangedListener<CoreDevice>,
    logger: Logger
  ) {
    this.logger = logger.tag(DeviceChangedService.name)
  }

  public async initialize(): Promise<void> {
    await this.updateStatusMessageFromCurrentDeviceStatus()
      .catch((error) => this.logger.data(error).error('Unable to update status messages from current devices'))
    this.listenForStatusMessageChanges(this.deviceChangedListener)
  }

  private async updateStatusMessageFromCurrentDeviceStatus(): Promise<void> {
    const devices: CoreDevice[] = await this.deviceRepository.getDevices()
    await Promise.all(devices.map(device => this.onDeviceUpdated(device)))

    const statusMessagesForDevices: StatusMessage[] = devices.map(device => this.convertDeviceToStatusMessage(device))
    await this.statusMessageService.deleteStatusMessagesWithIdPrefixNotInCollection(DEVICE_STATUS_MESSAGE_PREFIX, statusMessagesForDevices)
  }

  private listenForStatusMessageChanges(deviceChangedListener: DataChangedListener<CoreDevice>): void {
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

  private async onDeviceUpdated(device: CoreDevice): Promise<void> {
    if (!device.isConnected) {
      device.statusCode = StatusCode.BAD
      device.statusMessage = NOT_CONNECTED_MESSAGE
    }

    await this.statusMessageService.updateStatusMessage(this.convertDeviceToStatusMessage(device))
  }

  private convertDeviceToStatusMessage(device: CoreDevice): StatusMessage {
    return {
      id: `${DEVICE_STATUS_MESSAGE_PREFIX}${device.id}`,
      statusCode: device.statusCode,
      title: device.name,
      message: this.getDeviceMessage(device)
    }
  }

  private getDeviceMessage(device: CoreDevice): string {
    if (device.statusMessage) {
      return device.statusMessage
    }
    if (device.statusCode === StatusCode.GOOD) {
      return 'The device is in a good state.'
    }
    return ''
  }

  private async onDeviceDeleted(deviceId: string): Promise<void> {
    const deletedDevice: CoreDevice = {
      id: deviceId,
      name: '',
      statusMessage: 'Device was deleted',
      statusCode: StatusCode.GOOD,
      isConnected: false,
      type: DeviceType.ABSTRACT
    }

    await this.statusMessageService.updateStatusMessage(this.convertDeviceToStatusMessage(deletedDevice))
  }
}
