import { ConfigurationServiceImplementation } from '../configuration-service-implementation'
import { ConfigurationEventEmitter } from '../interfaces/configuration-event-emitter'
import { ShelfRepository } from '../../../data-access/repositories/interfaces/shelf-repository'
import { anything, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Shelf } from '../../../model/entities/shelf'

describe(ConfigurationServiceImplementation.name, () => {
  describe(ConfigurationServiceImplementation.prototype.updateShelf.name, () => {
    it('saves the shelf to the repository', async () => {
      const shelf: Shelf = {
        id: 'someId',
        actionPanels: []
      }
      const shelfRepository: ShelfRepository = mock<ShelfRepository>()

      const testee: ConfigurationServiceImplementation = createTestee({ shelfRepository: instance(shelfRepository) })
      await testee.updateShelf(shelf)

      verify(shelfRepository.updateShelf(shelf)).once()
    })

    it('emits the updated shelf from the repository', async () => {
      const updateShelf: Shelf = {
        id: 'someId',
        actionPanels: []
      }
      const shelfRepository: ShelfRepository = mock<ShelfRepository>()
      when(shelfRepository.updateShelf(anything())).thenReturn(Promise.resolve(updateShelf))

      const configurationEventEmitter: ConfigurationEventEmitter = mock<ConfigurationEventEmitter>()

      const testee: ConfigurationServiceImplementation = createTestee({
        configurationEventEmitter: instance(configurationEventEmitter),
        shelfRepository: instance(shelfRepository)
      })
      await testee.updateShelf({ } as Shelf) // The Shelf given is not allowed to be the 'updatedShelf' to verify the functionality.

      const [emittedShelf] = capture(configurationEventEmitter.emitShelfUpdated).last()
      expect(emittedShelf).toBe(updateShelf)
    })
  })
})

function createTestee(params?: {
  configurationEventEmitter?: ConfigurationEventEmitter,
  shelfRepository?: ShelfRepository
}): ConfigurationServiceImplementation {
  return new ConfigurationServiceImplementation(
    params?.configurationEventEmitter ?? instance(mock<ConfigurationEventEmitter>()),
    params?.shelfRepository ?? instance(mock<ShelfRepository>())
  )
}
