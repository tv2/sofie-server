import { BaseController, GetRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Request, Response } from 'express'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Exception } from '../../model/exceptions/exception'
import { Configuration } from '../../model/entities/configuration'

@RestController('/configurations')
export class ConfigurationController extends BaseController {
  constructor(
    private readonly configurationRepository: ConfigurationRepository,
    private readonly httpErrorHandler: HttpErrorHandler
  ) {
    super()
  }

  @GetRequest()
  public async getConfigurations(_reg: Request, res: Response): Promise<void> {
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
}