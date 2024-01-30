import { BaseController, GetRequest, RestController } from './base-controller'
import { SystemInformationRepository } from '../../data-access/repositories/interfaces/system-information-repository'
import { Request, Response } from 'express'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { SystemInformation } from '../../model/entities/system-information'
import { Exception } from '../../model/exceptions/exception'

@RestController('/systemInformation')
export class SystemInformationController extends BaseController {

  constructor(
    private readonly systemInformationRepository: SystemInformationRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getSystemInformation(_request: Request, response: Response): Promise<void> {
    try {
      const systemInformation: SystemInformation = await this.systemInformationRepository.getSystemInformation()
      response.send(this.httpResponseFormatter.formatSuccessResponse(systemInformation))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
