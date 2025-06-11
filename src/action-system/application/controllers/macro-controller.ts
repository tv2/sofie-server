import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { Request, Response } from 'express'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { Exception } from '../../../rundown-execution/domain/exceptions/exception'
import { MacroDto } from '../dtos/macro-dto'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { MacroService } from '../interfaces/macro-service'
import { Macro } from '../../domain/entities/macro'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/macros')
export class MacroController extends BaseController {

  constructor(
    private readonly macroService: MacroService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest('/:macroId')
  public async getMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroId: string = request.params.macroId
      const macro: Macro = await this.macroService.getMacro(macroId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new MacroDto(macro)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest()
  public async getMacros(_request: Request, response: Response): Promise<void> {
    try {
      const macros: Macro[] = await this.macroService.getMacros()
      response.send(this.httpResponseFormatter.formatSuccessResponse(macros.map(macro => new MacroDto(macro))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PostRequest()
  public async createMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroDto: MacroDto = request.body as MacroDto
      const macro: Macro = {
        id: macroDto.id,
        name: macroDto.name,
        operations: macroDto.operations
      }
      await this.macroService.createMacro(macro)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully created Macro ${macro.name}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }


  @AuditLog()
  @PutRequest()
  public async updateMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroDto: MacroDto = request.body as MacroDto
      const macro: Macro = {
        ...macroDto,
        id: macroDto.id,
      }
      await this.macroService.updateMacro(macroDto)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully updated Macro ${macro.id}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }


  @AuditLog()
  @DeleteRequest('/:macroId')
  public async deleteMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroId: string = request.params.macroId
      await this.macroService.deleteMacro(macroId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully deleted Macro ${macroId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @PutRequest('/execute/:macroId/rundowns/:rundownId')
  public async executeMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroId: string = request.params.macroId
      const rundownId: string = request.params.rundownId
      await this.macroService.executeMacro(macroId, rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully executed Macro ${macroId}`))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
