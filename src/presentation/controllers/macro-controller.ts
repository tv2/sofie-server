import { BaseController, DeleteRequest, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { MacroDto } from '../dtos/macro-dto'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { MacroService } from '../../business-logic/services/interfaces/macro-service'
import { Macro } from '../../model/entities/macro'

@RestController('/macros')
export class MacroController extends BaseController {

  constructor(
    private readonly macroService: MacroService,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

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

  @GetRequest()
  public async getMacros(_request: Request, response: Response): Promise<void> {
    try {
      const macros: Macro[] = await this.macroService.getMacros()
      response.send(this.httpResponseFormatter.formatSuccessResponse(macros.map(macro => new MacroDto(macro))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest()
  public async createMacro(request: Request, response: Response): Promise<void> {
    try {
      const macroDto: MacroDto = request.body as MacroDto
      const macro: Macro = {
        id: '', // No id has been created yet. The database will handle that for us
        name: macroDto.name,
        operations: macroDto.operations
      }
      await this.macroService.createMacro(macro)
      response.send(this.httpResponseFormatter.formatSuccessResponse(`Successfully created Macro ${macro.name}` ))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }


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
