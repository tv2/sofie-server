import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { DeviceDto } from '../dtos/device-dto'
import { HealthDto } from '../dtos/health-dto'
import { DeviceRestDto } from '../../model/entities/device'
import { INewsDevice, INewsDeviceRestDTO } from '../../model/entities/inews-device'
import { TelemetricsDevice, TelemetricsDeviceRestDTO } from '../../model/entities/telemetrics-device'

@RestController('/devices')
export class DeviceController extends BaseController{

  constructor(
    private readonly deviceService: DeviceService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest('/health')
  public health(_request: Request, response: Response): void {
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

  @GetRequest('/')
  public async getAllDeviceConfigurations(_request: Request, response: Response): Promise<void> {
    try {
      const configs = await this.deviceService.readAllConfigurations()
      response.send(this.httpResponseFormatter.formatSuccessResponse(
        configs.map(config => {
          switch (config.type) {
            case 'INewsDevice':
              // eslint-disable-next-line no-case-declarations
              const incfg = config as INewsDevice
              return new INewsDeviceRestDTO(config, incfg.username, incfg.password)
            case 'TelemetricsDevice': // Corrected case label
              // eslint-disable-next-line no-case-declarations
              const tmcfg = config as TelemetricsDevice
              return new TelemetricsDeviceRestDTO(config, tmcfg.host)
            default:
              throw new Error(`Unknown device type: ${config.type}`)
          }
        })
      ))
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

  @PostRequest('/')
  public async createDeviceConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const deviceDto: DeviceRestDto = request.body as DeviceRestDto //discriminator field

      switch(deviceDto.type){
        case 'INewsDevice':
          await this.deviceService.create(request.body as INewsDevice)
          break
        case 'TelemetricsDevice':
          await this.deviceService.create(request.body as TelemetricsDevice)
          break
        default:
          console.log('createDeviceConfiguration rececived a malformed request') //Help, replace me with a proper logger
          break
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
