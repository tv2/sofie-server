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
import { ShelfConfigurationRepository } from '../../data-access/repositories/interfaces/shelf-configuration-repository'
import { ShelfConfiguration } from '../../model/entities/shelf-configuration'
import { ShelfConfigurationDto } from '../dtos/shelf-configuration-dto'

@RestController('/configurations')
export class ConfigurationController extends BaseController {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly showStyleVariantRepository: ShowStyleVariantRepository,
    private readonly shelfConfigurationRepository: ShelfConfigurationRepository,
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

  @GetRequest('/shelfConfigurations')
  public async getShelfConfiguration(_request: Request, response: Response): Promise<void> {
    try {
      const shelfConfiguration: ShelfConfiguration = await this.shelfConfigurationRepository.getShelfConfiguration()
      response.send(this.httpResponseFormatter.formatSuccessResponse([new ShelfConfigurationDto(shelfConfiguration)]))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @PutRequest('/shelfConfigurations')
  public async updateShelfConfiguration(request: Request, response: Response): Promise<void> {
    try {
      const shelfConfigurationDto: ShelfConfigurationDto = request.body as ShelfConfigurationDto
      const shelfConfiguration: ShelfConfiguration = {
        id: shelfConfigurationDto.id,
        actionPanelConfigurations: shelfConfigurationDto.actionPanelConfigurations
      }
      const updatedShelfConfiguration: ShelfConfiguration = await this.configurationService.updateShelfConfiguration(shelfConfiguration)
      response.send(this.httpResponseFormatter.formatSuccessResponse(new ShelfConfigurationDto(updatedShelfConfiguration)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
