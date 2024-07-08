import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { DeviceDto } from '../dtos/device-dto'
import { HealthDto } from '../dtos/health-dto'

@RestController('/devices')
export class DeviceController extends BaseController{

  constructor(
    private readonly deviceService: DeviceService,
    // private readonly deviceRepository: MongoDeviceRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest('/health')
  public health(response: Response): void {
    try {
      const healthcheck = {
        statusCode: 200,
        state: 'Healthy'
      }
      response.send(this.httpResponseFormatter.formatSuccessResponse(new HealthDto(healthcheck.statusCode, healthcheck.state)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/devices')
  public async getAllDeviceConfigurations(response: Response): Promise<void> {
    try {
      const configs = await this.deviceService.readAllConfigurations()
      response.send(this.httpResponseFormatter.formatSuccessResponse(configs.map(config => new DeviceDto(config))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/devices/:id')
  public async getDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      const config = await this.deviceService.readConfiguration(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new DeviceDto(config)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest('/devices')
  public async createDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const config = request.body
      await this.deviceService.create(config)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/devices/:id')
  public async updateDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      const config = request.body
      await this.deviceService.update(deviceId, config)
      response.status(200).json(config)
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @DeleteRequest('/devices/:id')
  public async deleteDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      await this.deviceService.delete(deviceId)
      response.status(204).send()
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest('/devices/:id/reconnect')
  public async manualReconnectDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      await this.deviceService.disconnect(deviceId)
      await this.deviceService.connect(deviceId)
      response.status(200).send()
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
