import { BaseController, GetRequest, PostRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { DeviceService } from '../../business-logic/services/interfaces/device-service'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { Device, INewsDevice, TelemetricsDevice } from '../../model/entities/device'
import { DeviceType } from '../../model/enums/device-type'
import { INewsDeviceDto, TelemetricsDeviceDto } from '../dtos/device-dto'
import { HttpStatusCode } from '../http-status-code'


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
      const devices: Device[] = await this.deviceService.getDevices()
      response.send(this.httpResponseFormatter.formatSuccessResponse(
        devices.map(device => this.toDeviceDto(device))
      ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:deviceId')
  public async getDevice(request: Request, response: Response): Promise<void> {
    try {
      const deviceId: string = request.params.deviceId
      const device: Device = await this.deviceService.getDevice(deviceId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(this.toDeviceDto(device)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createDevice(request: Request, response: Response): Promise<void> {
    try {
      const device: Device = await request.body
      if (!Object.values(DeviceType).includes(device.type)) {
        response
          .status(HttpStatusCode.UNPROCESSABLE_CONTENT)
          .header('Content-Type', 'application/json')
          .send(`{
              "error": {
                "message": "Unprocessable Content: device type is not in the correct format"
              }
            }`)
        return
      }
      await this.deviceService.create(device)
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  private toDeviceDto(device: Device): Device | undefined {
    if (this.isINewsDevice(device)) return new INewsDeviceDto(device)
    if (this.isTelemetricsDevice(device)) return new TelemetricsDeviceDto(device)
    return undefined
  }

  private isINewsDevice(device: Device): device is INewsDevice {
    return device.type === DeviceType.INEWS
  }

  private isTelemetricsDevice(device: Device): device is TelemetricsDevice {
    return device.type === DeviceType.TELEMETRICS
  }
}