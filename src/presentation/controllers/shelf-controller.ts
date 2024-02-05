import { BaseController, GetRequest, PutRequest, RestController } from './base-controller'
import { ShelfRepository } from '../../data-access/repositories/interfaces/shelf-repository'
import { Request, Response } from 'express'
import { Shelf } from '../../model/entities/shelf'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { Exception } from '../../model/exceptions/exception'
import { ShelfDto } from '../dtos/shelf-dto'

@RestController('/shelves')
export class ShelfController extends BaseController {

  constructor(
    private readonly shelfRepository: ShelfRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getShelf(_request: Request, response: Response): Promise<void> {
    try {
      const shelf: Shelf = await this.shelfRepository.getShelf()
      response.send(this.httpResponseFormatter.formatSuccessResponse([new ShelfDto(shelf)]))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest()
  public async updateShelf(request: Request, response: Response): Promise<void> {
    try {
      const shelfDto: ShelfDto = request.body as ShelfDto
      const shelf: Shelf = {
        id: shelfDto.id,
        actionPanels: shelfDto.actionPanels
      }
      const updatedShelf: Shelf = await this.shelfRepository.updateShelf(shelf)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new ShelfDto(updatedShelf)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
