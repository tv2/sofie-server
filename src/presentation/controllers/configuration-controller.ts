import { BaseController, GetRequest, PostRequest, PutRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Request, Response } from 'express'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Exception } from '../../model/exceptions/exception'
import { Configuration } from '../../model/entities/configuration'
import { ShowStyleVariantRepository } from '../../data-access/repositories/interfaces/show-style-variant-repository'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { ConfigurationService } from '../../business-logic/services/interfaces/configuration-service'
import { ShelfRepository } from '../../data-access/repositories/interfaces/shelf-repository'
import { Shelf } from '../../model/entities/shelf'
import { ShelfDto } from '../dtos/shelf-dto'

@RestController('/configurations')
export class ConfigurationController extends BaseController {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly showStyleVariantRepository: ShowStyleVariantRepository,
    private readonly shelfRepository: ShelfRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest('/studio')
  public async getStudio(_request: Request, response: Response): Promise<void> {
    try {
      const configuration: Configuration = await this.configurationRepository.getConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse(configuration.studio))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/blueprints')
  public async getBlueprintConfiguration(_request: Request, response: Response): Promise<void> {
    try {
      const configuration: Configuration = await this.configurationRepository.getConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse({
        showStyleConfiguration: configuration.showStyle.blueprintConfiguration,
        studioConfiguration: configuration.studio.blueprintConfiguration
      }))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/rundowns/:rundownId')
  public async getShowStyleVariant(request: Request, response: Response): Promise<void> {
    try {
      const rundownId: string = request.params.rundownId
      const showStyleVariant: ShowStyleVariant = await this.showStyleVariantRepository.getShowStyleVariant(rundownId)
      response.send(this.httpResponseFormatter.formatSuccessResponse(showStyleVariant))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PostRequest('/cache/clear')
  public clearConfigurationCache(_request: Request, response: Response): void {
    try {
      this.configurationRepository.clearConfigurationCache()
      response.send(this.httpResponseFormatter.formatSuccessResponse(null))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/shelves')
  public async getShelf(_request: Request, response: Response): Promise<void> {
    try {
      const shelf: Shelf = await this.shelfRepository.getShelf()
      response.send(this.httpResponseFormatter.formatSuccessResponse([new ShelfDto(shelf)]))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/shelves')
  public async updateShelf(request: Request, response: Response): Promise<void> {
    try {
      const shelfDto: ShelfDto = request.body as ShelfDto
      const shelf: Shelf = {
        id: shelfDto.id,
        actionPanels: shelfDto.actionPanels
      }
      const updatedShelf: Shelf = await this.configurationService.updateShelf(shelf)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new ShelfDto(updatedShelf)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
