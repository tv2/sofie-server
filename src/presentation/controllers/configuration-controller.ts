import { BaseController, GetRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Request, Response } from 'express'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Exception } from '../../model/exceptions/exception'
import { Configuration } from '../../model/entities/configuration'
import { ShowStyleVariantRepository } from '../../data-access/repositories/interfaces/show-style-variant-repository'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'

@RestController('/configurations')
export class ConfigurationController extends BaseController {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly showStyleVariantRepository: ShowStyleVariantRepository,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @GetRequest()
  public async getBlueprintConfiguration(_req: Request, res: Response): Promise<void> {
    try {
      const configuration: Configuration = await this.configurationRepository.getConfiguration()
      res.send({
        showStyleConfiguration: configuration.showStyle.blueprintConfiguration,
        studioConfiguration: configuration.studio.blueprintConfiguration
      })
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

  @GetRequest('/rundowns/:rundownId')
  public async getShowStyleVariant(req: Request, res: Response): Promise<void> {
    try {
      const rundownId: string = req.params.rundownId
      const showStyleVariant: ShowStyleVariant = await this.showStyleVariantRepository.getShowStyleVariant(rundownId)
      res.send(showStyleVariant)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }

}