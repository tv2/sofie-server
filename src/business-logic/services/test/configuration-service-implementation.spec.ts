import { ConfigurationServiceImplementation } from '../configuration-service-implementation'
import { ConfigurationEventEmitter } from '../interfaces/configuration-event-emitter'
import { ShelfConfigurationRepository } from '../../../data-access/repositories/interfaces/shelf-configuration-repository'
import { anything, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { ShelfConfiguration } from '../../../model/entities/shelf-configuration'

describe(ConfigurationServiceImplementation.name, () => {
  describe(ConfigurationServiceImplementation.prototype.updateShelfConfiguration.name, () => {
    it('saves the shelfConfiguration to the repository', async () => {
      const shelfConfiguration: ShelfConfiguration = {
        id: 'someId',
        actionPanelConfigurations: [],
        staticActionIds: []
      }
      const shelfConfigurationRepository: ShelfConfigurationRepository = mock<ShelfConfigurationRepository>()

      const testee: ConfigurationServiceImplementation = createTestee({ shelfConfigurationRepository: instance(shelfConfigurationRepository) })
      await testee.updateShelfConfiguration(shelfConfiguration)

      verify(shelfConfigurationRepository.updateShelfConfiguration(shelfConfiguration)).once()
    })

    it('emits the updated shelfConfiguration from the repository', async () => {
      const updateShelfConfiguration: ShelfConfiguration = {
        id: 'someId',
        actionPanelConfigurations: [],
        staticActionIds: []
      }
      const shelfConfigurationRepository: ShelfConfigurationRepository = mock<ShelfConfigurationRepository>()
      when(shelfConfigurationRepository.updateShelfConfiguration(anything())).thenReturn(Promise.resolve(updateShelfConfiguration))

      const configurationEventEmitter: ConfigurationEventEmitter = mock<ConfigurationEventEmitter>()

      const testee: ConfigurationServiceImplementation = createTestee({
        configurationEventEmitter: instance(configurationEventEmitter),
        shelfConfigurationRepository: instance(shelfConfigurationRepository)
      })
      await testee.updateShelfConfiguration({ } as ShelfConfiguration) // The Shelf given is not allowed to be the 'updatedShelf' to verify the functionality.

      const [emittedShelfConfiguration] = capture(configurationEventEmitter.emitShelfConfigurationUpdated).last()
      expect(emittedShelfConfiguration).toBe(updateShelfConfiguration)
    })
  })
})

function createTestee(params?: {
  configurationEventEmitter?: ConfigurationEventEmitter,
  shelfConfigurationRepository?: ShelfConfigurationRepository
}): ConfigurationServiceImplementation {
  return new ConfigurationServiceImplementation(
    params?.configurationEventEmitter ?? instance(mock<ConfigurationEventEmitter>()),
    params?.shelfConfigurationRepository ?? instance(mock<ShelfConfigurationRepository>())
  )
}
