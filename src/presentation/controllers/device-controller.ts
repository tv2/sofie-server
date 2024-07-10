import { BaseController, GetRequest, PostRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { Logger } from '../../logger/logger'
import { Device } from '../../model/entities/device'

@RestController('/devices')
export class DeviceController extends BaseController{

  constructor(
    private readonly deviceService: DeviceService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter,
    private readonly logger: Logger
  ) {
    super()
  }

  @GetRequest()
  public async getAllDevices(_request: Request, response: Response): Promise<void> {
    try {
      const devices: Device[] = await this.deviceService.getDevices()
      response.send(this.httpResponseFormatter.formatSuccessResponse(devices))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:deviceId')
  public async getDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.deviceId
      const device: Device = await this.deviceService.getDevice(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(device))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createDevice(request: Request, response: Response): Promise<void> {
    try {
      const device: Device = await request.body
      console.log(device)
     
      await this.deviceService.create(device)
  
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}