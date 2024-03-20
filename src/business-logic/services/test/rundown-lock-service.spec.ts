import { ThrottledRundownService } from './../rundown-lock-service'
import { instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { LockRundownException } from '../../../model/exceptions/lock-rundown-exception'

describe(ThrottledRundownService.name, () => {
  describe('when two operations are performed within the locked interval', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())
    describe('throws an error to second operation', () => {
      it('throws error when two take nexts are performed with 0ms delay', async () => {
        const mockRepo: ThrottledRundownService = mock<ThrottledRundownService>()
        const randomRundownId: string = 'randomRundownId'
        const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

        when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRepo))

        await testee.takeNext(randomRundown.id)

        verify(mockRepo.takeNext(randomRundownId)).once()

        const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

        expect(result).toThrow(LockRundownException)
      })

      it('throws error when two different actions are performed with 0ms delay', async () => {
        const mockRepo: ThrottledRundownService = mock<ThrottledRundownService>()
        const randomRundownId: string = 'randomRundownId'
        const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

        when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
        when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRepo))

        await testee.activateRundown(randomRundown.id)

        verify(mockRepo.activateRundown(randomRundownId)).once()

        const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

        expect(result).toThrow(LockRundownException)
      })

      it('throws error when two take nexts are performed with 499ms delay', async () => {
        const mockRepo: ThrottledRundownService = mock<ThrottledRundownService>()
        const randomRundownId: string = 'randomRundownId'
        const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
        const now: number = Date.now()

        jest.setSystemTime(now)

        when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
        when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRepo))

        await testee.activateRundown(randomRundown.id)

        verify(mockRepo.activateRundown(randomRundownId)).once()

        jest.advanceTimersByTime(499)

        const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

        expect(result).toThrow(LockRundownException)
      })
    })
  })

  describe('when two operations are performed outside of a locked interval', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())
    it('performed two take nexts with 500ms between', async () => {
      const mockRepo: ThrottledRundownService = mock<ThrottledRundownService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
      const now: number = Date.now()

      jest.setSystemTime(now)

      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRepo))

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).once()

      jest.advanceTimersByTime(500)

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).times(2)
    })

    it('performed two different operations with 500ms between', async () => {
      const mockRepo: ThrottledRundownService = mock<ThrottledRundownService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
      const now: number = Date.now()

      jest.setSystemTime(now)

      when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRepo))

      await testee.activateRundown(randomRundown.id)

      verify(mockRepo.activateRundown(randomRundownId)).once()

      jest.advanceTimersByTime(500)

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).once()
    })
  })
})
