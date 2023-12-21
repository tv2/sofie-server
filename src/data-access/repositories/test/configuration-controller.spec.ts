import {instance, mock, verify} from '@typestrong/ts-mockito'
import { ConfigurationRepository } from '../interfaces/configuration-repository'
import { ConfigurationController } from '../../../presentation/controllers/configuration-controller'
import {Response } from 'express'
import {ShowStyleVariantRepository} from '../interfaces/show-style-variant-repository'
import {HttpErrorHandler} from '../../../presentation/interfaces/http-error-handler'
import {HttpResponseFormatter} from '../../../presentation/interfaces/http-response-formatter'

describe(ConfigurationController.name, () => {
  describe(ConfigurationController.prototype.postClearConfigurationCache.name, () => {
    it('invokes repo method for clearing of configuration cache when posted', () => {
      const mockResponse: Response = mock<Response>()

      const mockConfigurationRepository: ConfigurationRepository = mock<ConfigurationRepository>()
      const mockShowStyleVariantRepository: ShowStyleVariantRepository = mock<ShowStyleVariantRepository>()
      const mockHttpErrorHandler: HttpErrorHandler = mock<HttpErrorHandler>()
      const mockHttpResponseFormatter: HttpResponseFormatter = mock<HttpResponseFormatter>()
      const configurationController: ConfigurationController = new ConfigurationController(
        instance(mockConfigurationRepository),
        instance(mockShowStyleVariantRepository),
        instance(mockHttpErrorHandler),
        instance(mockHttpResponseFormatter)
      )
      configurationController.postClearConfigurationCache(mockResponse)
      verify(mockConfigurationRepository.clearConfigurationCache()).once()
    })
  })
})