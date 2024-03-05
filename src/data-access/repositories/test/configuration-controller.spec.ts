import { instance, mock, verify } from '@typestrong/ts-mockito'
import { ConfigurationRepository } from '../interfaces/configuration-repository'
import { ConfigurationController } from '../../../presentation/controllers/configuration-controller'
import { Request, Response } from 'express'
import { ShowStyleVariantRepository } from '../interfaces/show-style-variant-repository'
import { HttpErrorHandler } from '../../../presentation/interfaces/http-error-handler'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { ConfigurationService } from '../../../business-logic/services/interfaces/configuration-service'
import { ShelfConfigurationRepository } from '../interfaces/shelf-configuration-repository'

describe(ConfigurationController.name, () => {
  describe(
    ConfigurationController.prototype.clearConfigurationCache.name,
    () => {
      it('invokes repo method for clearing of configuration cache when posted', () => {
        const mockRequest: Request = mock<Request>()
        const mockResponse: Response = mock<Response>()
        const configurationRepository: ConfigurationRepository =
          mock<ConfigurationRepository>()

        const testee: ConfigurationController = createTestee({
          configurationRepository: instance(configurationRepository)
        })

        testee.clearConfigurationCache(
          mockRequest,
          mockResponse,
        )
        verify(configurationRepository.clearConfigurationCache()).once()
      })
    },
  )
})

function createTestee(params?: {
  configurationService?: ConfigurationService,
  configurationRepository?: ConfigurationRepository,
  showStyleVariantRepository?: ShowStyleVariantRepository,
  shelfConfigurationRepository?: ShelfConfigurationRepository,
  httpErrorHandler?: HttpErrorHandler,
  httpResponseFormatter?: HttpResponseFormatter
}): ConfigurationController {
  return new ConfigurationController(
    params?.configurationService ?? instance(mock<ConfigurationService>()),
    params?.configurationRepository ?? instance(mock<ConfigurationRepository>()),
    params?.showStyleVariantRepository ?? instance(mock<ShowStyleVariantRepository>()),
    params?.shelfConfigurationRepository ?? instance(mock<ShelfConfigurationRepository>()),
    params?.httpErrorHandler ?? instance(mock<HttpErrorHandler>()),
    params?.httpResponseFormatter ?? instance(mock<HttpResponseFormatter>()),
  )
}
