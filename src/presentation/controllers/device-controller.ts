import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { DeviceDto } from '../dtos/device-dto'
import { Device, DeviceRestDto } from '../../model/entities/device'
import { INewsDevice, INewsDeviceRestDTO } from '../../model/entities/inews-device'
import { TelemetricsDevice, TelemetricsDeviceRestDTO } from '../../model/entities/telemetrics-device'
import { Logger } from '../../logger/logger'
import { BadRequestException } from '../../model/exceptions/bad-request-exception'

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
  public async getAllDeviceConfigurations(_request: Request, response: Response): Promise<void> {
    try {
      const devices: Device[] = await this.deviceService.readAllDeviceConfigurations()
      const deviceDtos: (TelemetricsDeviceRestDTO | INewsDeviceRestDTO | undefined)[] = devices.map(device => {
        if(device instanceof INewsDevice){
          return new INewsDeviceRestDTO(device)
        }
        if(device instanceof TelemetricsDevice){
          return new TelemetricsDeviceRestDTO(device)
        }
        this.logger.warn('Unsupported device ${device.name} found in the dataset. ')     
      })
      response.send(this.httpResponseFormatter.formatSuccessResponse(deviceDtos))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:id')
  public async getDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      const config = await this.deviceService.readConfiguration(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new DeviceDto(config)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceDto: DeviceRestDto = request.body as DeviceRestDto
      switch(deviceDto.type){
        case 'INewsDevice':
          await this.deviceService.create(request.body as INewsDevice)
          break
        case 'TelemetricsDevice':
          await this.deviceService.create(request.body as TelemetricsDevice)
          break
        default:
          throw new BadRequestException('Unsupported device format or malformed JSON')
      }
  
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/:id')
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

  @DeleteRequest('/:id')
  public async deleteDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceId = request.params.id
      await this.deviceService.delete(deviceId)
      response.status(204).send()
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest('/:id/reconnect')
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