import { DataChangeService } from './interfaces/data-change-service'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { CoreDevice } from '../../model/entities/core-device'
import { StatusMessage } from '../../model/entities/status-message'
import { StatusCode } from '../../model/enums/status-code'
import { CoreDeviceRepository } from '../../data-access/repositories/interfaces/core-device-repository'
import { Logger } from '../../logger/logger'
import { StatusMessageService } from './interfaces/status-message-service'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'

// TODO: Find a way to translate
const NOT_CONNECTED_MESSAGE: string = 'Not connected'

export class DeviceChangedService implements DataChangeService {
  private static instance: DataChangeService

  public static getInstance(
    statusMessageService: StatusMessageService,
    deviceRepository: CoreDeviceRepository,
    deviceChangedListener: DataChangedListener<CoreDevice>,
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
    private readonly deviceRepository: CoreDeviceRepository,
    deviceChangedListener: DataChangedListener<CoreDevice>,
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
    const devices: CoreDevice[] = await this.deviceRepository.getDevices()
    await Promise.all(devices.map(device => this.onDeviceUpdated(device)))
  }

  private listenForStatusMessageChanges(deviceChangedListener: DataChangedListener<CoreDevice>): void {
    deviceChangedListener.onCreated(device => {
      this.onDeviceUpdated(device).catch(error => this.logger.data(error).error(`Failed processing device created event for device '${device.name}' with id '${device.id}'.`))
    })
    deviceChangedListener.onUpdated(device => {
      this.onDeviceUpdated(device).catch(error => this.logger.data(error).error(`Failed processing device updated event for device '${device.name}' with id '${device.id}'.`))
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
      id: device.id,
      statusCode: device.statusCode,
      title: device.name,
      message: device.statusMessage
    }
  }
}
