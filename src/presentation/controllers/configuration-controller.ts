import { BaseController, GetRequest, PostRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Request, Response } from 'express'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Exception } from '../../model/exceptions/exception'
import { Configuration } from '../../model/entities/configuration'
import { ShowStyleVariantRepository } from '../../data-access/repositories/interfaces/show-style-variant-repository'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'

@RestController('/configurations')
export class ConfigurationController extends BaseController {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly showStyleVariantRepository: ShowStyleVariantRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
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

  @PostRequest('/reset')
  public postClearConfigurationCache(request: Request, response: Response): Promise<void> {
    try {
      this.configurationRepository.clearConfigurationCache()
      response.send(this.httpResponseFormatter.formatSuccessResponse())
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

}