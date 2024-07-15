import {BaseController, GetRequest, PostRequest, RestController} from './base-controller'
import {Request, Response} from 'express'
import {DeviceService} from '../../business-logic/services/interfaces/device-service'
import {HttpErrorHandler} from '../interfaces/http-error-handler'
import {Exception} from '../../model/exceptions/exception'
import {HttpResponseFormatter} from '../interfaces/http-response-formatter'
import {Device, INewsDevice, TelemetricsDevice} from '../../model/entities/device'
import {DeviceType} from '../../model/enums/device-type'
import {DeviceDtoInterface, INewsDeviceDto, TelemetricsDeviceDto} from '../dtos/device-dto'
import {UnprocessableEntityException} from '../../model/exceptions/unprocessable-entity-exception'


@RestController('/devices')
export class DeviceController extends BaseController {

  constructor(
    private readonly deviceService: DeviceService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter,
  ) {
    super()
  }

  @GetRequest()
  public async getAllDevices(_request: Request, response: Response): Promise<void> {
    try {
      response.send(this.httpResponseFormatter.formatSuccessResponse(
        (await this.deviceService.getDevices()).map(device => this.toDto(device))
      ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:deviceId')
  public async getDevice(request: Request, response: Response): Promise<void> {
    try {
      const {deviceId} = request.params
      const device: Device = await this.deviceService.getDevice(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(this.toDto(device)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createDevice(request: Request, response: Response): Promise<void> {
    try {
      const device: Device = await request.body
      if (!Object.values(DeviceType).includes(device.type)) {
        throw new UnprocessableEntityException('device type was not in the correct numerical format')
      }

      await this.deviceService.create(device)

      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  private toDto(device: Device): DeviceDtoInterface | undefined {
    if (this.isINewsDevice(device)) {
      return new INewsDeviceDto(device)
    }
    if (this.isTelemetricsDevice(device)) {
      return new TelemetricsDeviceDto(device)
    }
    return undefined
  }

  private isINewsDevice(device: Device): device is INewsDevice {
    return device.type === DeviceType.INEWS
  }

  private isTelemetricsDevice(device: Device): device is TelemetricsDevice {
    return device.type === DeviceType.TELEMETRICS
  }
}