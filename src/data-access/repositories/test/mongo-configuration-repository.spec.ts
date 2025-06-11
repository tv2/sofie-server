import {instance, mock} from '@typestrong/ts-mockito'
import {MongoConfigurationRepository} from '../../../rundown-execution/infrastructure/repositories/mongodb/mongo-configuration-repository'
import {StudioRepository} from '../../../rundown-execution/domain/repositories/studio-repository'
import {ShowStyleRepository} from '../../../rundown-execution/domain/repositories/show-style-repository'

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
