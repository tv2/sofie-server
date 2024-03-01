import { DatabaseChangeService } from './interfaces/database-change-service'
import { StatusMessageEventEmitter } from './interfaces/status-message-event-emitter'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { Device } from '../../model/entities/device'
import { StatusMessage } from '../../model/entities/status-message'
import { StatusMessageRepository } from '../../data-access/repositories/interfaces/status-message-repository'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { StatusCode } from '../../model/enums/status-code'
import { DeviceRepository } from '../../data-access/repositories/interfaces/device-repository'
import { Logger } from '../../logger/logger'

// TODO: Find a way to translate
const NOT_CONNECTED_MESSAGE: string = 'Not connected'

export class DeviceChangedService implements DatabaseChangeService {
  private static instance: DatabaseChangeService

  public static getInstance(
    statusMessageEventEmitter: StatusMessageEventEmitter,
    statusMessageRepository: StatusMessageRepository,
    deviceRepository: DeviceRepository,
    deviceChangedListener: DataChangedListener<Device>,
    logger: Logger
  ): DatabaseChangeService {
    if (!this.instance) {
      this.instance = new DeviceChangedService(
        statusMessageEventEmitter,
        statusMessageRepository,
        deviceRepository,
        deviceChangedListener,
        logger
      )
    }
    return this.instance
  }

  private readonly logger: Logger

  constructor(
    private readonly statusMessageEventEmitter: StatusMessageEventEmitter,
    private readonly statusMessageRepository: StatusMessageRepository,
    private readonly deviceRepository: DeviceRepository,
    deviceChangedListener: DataChangedListener<Device>,
    logger: Logger
  ) {
    this.logger = logger.tag(DeviceChangedService.name)
    this.callAgainOnError(() => this.updateStatusMessageFromCurrentDeviceStatus())
    this.listenForStatusMessageChanges(deviceChangedListener)
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

  private async updateStatusMessageFromCurrentDeviceStatus(): Promise<void> {
    const devices: Device[] = await this.deviceRepository.getDevices()
    await Promise.all(devices.map(device => this.onDeviceUpdated(device)))
  }

  private listenForStatusMessageChanges(deviceChangedListener: DataChangedListener<Device>): void {
    deviceChangedListener.onCreated(device => void this.onDeviceUpdated(device))
    deviceChangedListener.onUpdated(device => void this.onDeviceUpdated(device))
  }

  private async onDeviceUpdated(device: Device): Promise<void> {
    if (!device.isConnected) {
      device.statusCode = StatusCode.BAD
      device.statusMessage = NOT_CONNECTED_MESSAGE
    }

    const statusMessageFromDatabase: StatusMessage | undefined = await this.getStatusMessageFromDatabase(device.id)
    if (!statusMessageFromDatabase) {
      await this.createNewStatusMessageIfStatusIsNotGood(device)
      return
    }

    if (!this.isStatusMessagesDifferent(statusMessageFromDatabase, this.convertDeviceToStatusMessage(device))) {
      return
    }

    this.statusMessageEventEmitter.emitStatusMessageEvent(this.convertDeviceToStatusMessage(device))

    if ([StatusCode.GOOD].includes(device.statusCode)) {
      await this.statusMessageRepository.deleteStatusMessage(statusMessageFromDatabase.id)
      return
    }

    await this.statusMessageRepository.updateStatusMessage(this.convertDeviceToStatusMessage(device))
  }

  private async createNewStatusMessageIfStatusIsNotGood(device: Device): Promise<void> {
    if ([StatusCode.GOOD].includes(device.statusCode)) {
      return
    }
    this.statusMessageEventEmitter.emitStatusMessageEvent(this.convertDeviceToStatusMessage(device))
    await this.statusMessageRepository.createStatusMessage(this.convertDeviceToStatusMessage(device))
  }

  private async getStatusMessageFromDatabase(statusMessageId: string): Promise<StatusMessage | undefined> {
    try {
      return await this.statusMessageRepository.getStatusMessage(statusMessageId)
    } catch (error) {
      if (error instanceof NotFoundException) {
        return
      }
      throw error
    }
  }

  private isStatusMessagesDifferent(statusMessageOne: StatusMessage, statusMessageTwo: StatusMessage): boolean {
    const isDifferentStatusCode: boolean = statusMessageOne.statusCode != statusMessageTwo.statusCode
    const isDifferentMessage: boolean = statusMessageOne.message != statusMessageTwo.message
    return isDifferentStatusCode || isDifferentMessage
  }

  private convertDeviceToStatusMessage(device: Device): StatusMessage {
    return {
      id: device.id,
      statusCode: device.statusCode,
      title: device.name,
      message: device.statusMessage
    }
  }
}
