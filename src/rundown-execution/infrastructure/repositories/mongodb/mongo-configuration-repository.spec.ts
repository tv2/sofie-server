import { instance, mock } from '@typestrong/ts-mockito'
import { MongoConfigurationRepository } from './mongo-configuration-repository'
import { StudioRepository } from '../../../domain/repositories/studio-repository'
import { ShowStyleRepository } from '../../../domain/repositories/show-style-repository'

describe(MongoConfigurationRepository.name, () => {
  describe(MongoConfigurationRepository.prototype.clearConfigurationCache.name, () => {
    it('throws error when invoked', () => {
      const mockStudioRepository: StudioRepository = mock<StudioRepository>()
      const mockShowStyleRepository: ShowStyleRepository = mock<ShowStyleRepository>()
      const aMongoConfigurationRepository: MongoConfigurationRepository = new MongoConfigurationRepository(
        instance(mockStudioRepository),
        instance(mockShowStyleRepository)
      )
      expect(() => aMongoConfigurationRepository.clearConfigurationCache()).toThrow('Method not applicable.')
    })
  })
})
