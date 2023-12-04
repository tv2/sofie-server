import { CachedRundownRepository } from '../cache/cached-rundown-repository'
import { RundownRepository } from '../interfaces/rundown-repository'
import { anyString, anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { Logger } from '../../../logger'

describe(CachedRundownRepository.name, () => {
  describe(CachedRundownRepository.prototype.getRundown.name, () => {
    it('receives a RundownId returns a rundown', async () => {
      const mockRepo: RundownRepository = mock<RundownRepository>()

      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

      const testee: CachedRundownRepository = new CachedRundownRepository(instance(mockRepo), createLogger())

      const result: Rundown = await testee.getRundown(randomRundownId)
      expect(result).toBe(randomRundown)
    })

    it('receives two request to fetch the same Rundown, only call the database once', async () => {
      const mockRepo: RundownRepository = mock<RundownRepository>()

      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.getRundown(randomRundownId)).thenReturn(Promise.resolve(randomRundown))

      const testee: CachedRundownRepository = new CachedRundownRepository(instance(mockRepo), createLogger())

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
