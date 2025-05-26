import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { DeviceConfiguration } from '../../model/entities/device-configuration'
import { DeviceType } from '../../model/enums/device-type'
import { DeviceDto } from '../dtos/device-dto'
import { ConflictException } from '../../model/exceptions/conflict-exception'
import { HttpStatusCode } from '../http-status-code'
import { ApiError } from '../value-objects/ApiError'
import { VideoMixerDeviceRepository } from '../../data-access/repositories/interfaces/video-mixer-device-repository'
import { VideoMixerConfiguration } from '../../model/value-objects/video-mixer-configuration'
import { AuditLog } from '../decorators/audit-log-decorator'
import { Device } from '../../model/entities/devices/device'

@RestController('/devices')
export class DeviceController extends BaseController {

  constructor(
    private readonly deviceService: DeviceService,
    private readonly videoMixerDeviceRepository: VideoMixerDeviceRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter,
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public getAllDevices(_request: Request, response: Response): void {
    try {
      const devices: Device[] = this.deviceService.getDevices()
      response.send(this.httpResponseFormatter.formatSuccessResponse(devices.map(device => new DeviceDto(device))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest('/:deviceId')
  public getDevice(request: Request, response: Response): void {
    try {
      const deviceId: string = request.params.deviceId
      const device: Device = this.deviceService.getDevice(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new DeviceDto(device)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PostRequest()
  public async createDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceConfiguration: DeviceConfiguration = await request.body
      if (!Object.values(DeviceType).includes(deviceConfiguration.type)) {
        response
          .status(HttpStatusCode.UNPROCESSABLE_CONTENT)
          .header('Content-Type', 'application/json')
          .send(new ApiError('Unprocessable Content: device type is not in the correct format').toJson())
        return
      }
      await this.deviceService.create(deviceConfiguration)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest('/:deviceConfigurationId')
  public async updateDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceConfiguration: DeviceConfiguration = await request.body
      const deviceConfigurationId: string = request.params.deviceConfigurationId

      if (deviceConfiguration.id !== deviceConfigurationId) {
        throw new ConflictException('Conflict: The ID in the URL path does not match the ID in the request body.')
      }  //to be in compliance with the REST convention (it is not a strict rule) we pass in the ID, and then we validate it against the body ID to stop IDOR attacks

      await this.deviceService.update(deviceConfiguration)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @DeleteRequest('/:deviceConfigurationId')
  public async deleteDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceConfigurationId: string = request.params.deviceConfigurationId
      await this.deviceService.delete(deviceConfigurationId)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PostRequest('/:deviceConfigurationId/reconnect')
  public reconnectDevice(request: Request, response: Response): void {
    try {
      const deviceConfigurationId: string = request.params.deviceConfigurationId
      this.deviceService.reconnect(deviceConfigurationId)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest('/videoMixers/configurations')
  public async getVideoMixerConfiguration(_request: Request, response: Response): Promise<void> {
    try {
      const videoMixerConfiguration: VideoMixerConfiguration = await this.videoMixerDeviceRepository.getVideoMixerConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse(videoMixerConfiguration))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
