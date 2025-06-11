import { CachedRundownAggregateRepository } from './cached-rundown-aggregate-repository'
import { anyString, anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { RundownAggregateRepository } from '../../../domain/repositories/rundown-aggregate-repository'
import { Rundown, RundownInterface } from '../../../domain/entities/rundown'
import { Logger } from '../../../../cross-cutting-concerns/application/logger'

describe(CachedRundownAggregateRepository.name, () => {
  describe(CachedRundownAggregateRepository.prototype.getRundown.name, () => {
    it('receives a RundownId returns a rundown', async () => {
      const mockRepo: RundownAggregateRepository = mock<RundownAggregateRepository>()

      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

      const testee: CachedRundownAggregateRepository = new CachedRundownAggregateRepository(instance(mockRepo), createLogger())

      const result: Rundown = await testee.getRundown(randomRundownId)
      expect(result).toBe(randomRundown)
    })

    it('receives two request to fetch the same Rundown, only call the database once', async () => {
      const mockRepo: RundownAggregateRepository = mock<RundownAggregateRepository>()

      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

      const testee: CachedRundownAggregateRepository = new CachedRundownAggregateRepository(instance(mockRepo), createLogger())

      await testee.getRundown(randomRundownId)
      await testee.getRundown(randomRundownId)

      verify(mockRepo.getRundown(randomRundownId)).once()
    })
  })

  function createLogger(): Logger {
    const mockedLogger: Logger = mock<Logger>()
    when(mockedLogger.tag(anyString())).thenCall(() => createLogger())
    when(mockedLogger.data(anything())).thenCall(() => createLogger())
    when(mockedLogger.metadata(anything())).thenCall(() => createLogger())
    return instance(mockedLogger)
  }
})
