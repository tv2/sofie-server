import { DatabaseChangeService } from './interfaces/database-change-service'
import { StatusMessageEventEmitter } from './interfaces/status-message-event-emitter'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { Device } from '../../model/entities/device'
import { StatusMessage } from '../../model/entities/status-message'
import { StatusMessageRepository } from '../../data-access/repositories/interfaces/status-message-repository'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { StatusCode } from '../../model/enums/status-code'

export class DeviceChangedService implements DatabaseChangeService {
  private static instance: DatabaseChangeService

  public static getInstance(
    statusMessageEventEmitter: StatusMessageEventEmitter,
    statusMessageRepository: StatusMessageRepository,
    deviceChangedListener: DataChangedListener<Device>
  ): DatabaseChangeService {
    if (!this.instance) {
      this.instance = new DeviceChangedService(
        statusMessageEventEmitter,
        statusMessageRepository,
        deviceChangedListener
      )
    }
    return this.instance
  }

  constructor(
    private readonly statusMessageEventEmitter: StatusMessageEventEmitter,
    private readonly statusMessageRepository: StatusMessageRepository,
    deviceChangedListener: DataChangedListener<Device>
  ) {
    this.listenForStatusMessageChanges(deviceChangedListener)
  }

  private listenForStatusMessageChanges(deviceChangedListener: DataChangedListener<Device>): void {
    deviceChangedListener.onUpdated(device => void this.onDeviceUpdated(device))
  }

  private async onDeviceUpdated(device: Device): Promise<void> {
    const statusMessageFromDatabase: StatusMessage | undefined = await this.getStatusMessageFromDatabase(device.id)
    if (!statusMessageFromDatabase) {
      if (!device.isConnected) {
        return
      }

      if ([StatusCode.GOOD, StatusCode.UNKNOWN].includes(device.statusCode)) {
        return
      }
      this.statusMessageEventEmitter.emitStatusMessageEvent(this.convertDeviceToStatusMessage(device))
      await this.statusMessageRepository.createStatusMessage(this.convertDeviceToStatusMessage(device))
      return
    }

    if (!device.isConnected) {
      await this.statusMessageRepository.deleteStatusMessage(statusMessageFromDatabase.id)
      return
    }

    if (!this.isStatusMessagesDifferent(statusMessageFromDatabase, this.convertDeviceToStatusMessage(device))) {
      return
    }

    if ([StatusCode.GOOD, StatusCode.UNKNOWN].includes(device.statusCode)) {
      await this.statusMessageRepository.deleteStatusMessage(statusMessageFromDatabase.id)
    } else {
      await this.statusMessageRepository.updateStatusMessage(this.convertDeviceToStatusMessage(device))
    }

    this.statusMessageEventEmitter.emitStatusMessageEvent(this.convertDeviceToStatusMessage(device))
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
    const message: string = device.statusMessage.length === 0
      ? ''
      : device.statusMessage.reduce((previousValue, currentValue) => `${previousValue}; ${currentValue}`)

    return {
      id: device.id,
      statusCode: device.statusCode,
      title: device.name,
      message
    }
  }
}
