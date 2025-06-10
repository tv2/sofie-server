import { BaseController, GetRequest, RestController } from '../../../cross-cutting-concerns/application/base-controller'
import { SystemInformationRepository } from '../../../data-access/repositories/interfaces/system-information-repository'
import { Request, Response } from 'express'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { SystemInformation } from '../../domain/entities/system-information'
import { Exception } from '../../domain/exceptions/exception'
import { StatusMessageRepository } from '../../../data-access/repositories/interfaces/status-message-repository'
import { StatusMessage } from '../../domain/entities/status-message'
import { StatusMessageDto } from '../dtos/status-message-dto'
import { SystemInformationDto } from '../dtos/system-information-dto'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/systemInformation')
export class SystemInformationController extends BaseController {

  constructor(
    private readonly systemInformationRepository: SystemInformationRepository,
    private readonly statusMessageRepository: StatusMessageRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public async getSystemInformation(_request: Request, response: Response): Promise<void> {
    try {
      const systemInformation: SystemInformation = await this.systemInformationRepository.getSystemInformation()
      response.send(this.httpResponseFormatter.formatSuccessResponse(new SystemInformationDto(systemInformation)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest('/statusMessages')
  public async getStatusMessages(_request: Request, response: Response): Promise<void> {
    try {
      const statusMessages: StatusMessage[]  = await this.statusMessageRepository.getAllStatusMessages()
      const statusMessageDtos: StatusMessageDto[] = statusMessages.map(statusMessage => new StatusMessageDto(statusMessage))
      response.send(this.httpResponseFormatter.formatSuccessResponse(statusMessageDtos))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
