import { Shelf } from '../../model/entities/shelf'
import { ConfigurationService } from './interfaces/configuration-service'
import { ConfigurationEventEmitter } from './interfaces/configuration-event-emitter'
import { ShelfRepository } from '../../data-access/repositories/interfaces/shelf-repository'

export class ConfigurationServiceImplementation implements ConfigurationService {

  constructor(
    private readonly configurationEventEmitter: ConfigurationEventEmitter,
    private readonly shelfRepository: ShelfRepository
  ) { }

  public async updateShelf(shelf: Shelf): Promise<Shelf> {
    const updateShelf: Shelf = await this.shelfRepository.updateShelf(shelf)
    this.configurationEventEmitter.emitShelfUpdated(updateShelf)
    return updateShelf
  }
}
