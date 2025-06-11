import { BaseController, GetRequest, RestController } from '../../../cross-cutting-concerns/application/base-controller'
import { Request, Response } from 'express'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { Exception } from '../../domain/exceptions/exception'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { VideoMixerDeviceRepository } from '../../domain/repositories/video-mixer-device-repository'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/devices')
export class DeviceController extends BaseController {

  constructor(
    private readonly videoMixerDeviceRepository: VideoMixerDeviceRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter,
  ) {
    super()
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
