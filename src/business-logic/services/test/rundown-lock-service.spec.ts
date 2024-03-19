import { RundownLockService } from './../rundown-lock-service'
import { instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { LockRundownException } from '../../../model/exceptions/lock-rundown-exception'

describe(RundownLockService.name, () => {
  describe('Rundown lock throw error cases', () => {
    it('Throw error if we call 2 times takeNext without any time between', async () => {
      const mockRepo: RundownLockService = mock<RundownLockService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: RundownLockService = new RundownLockService(instance(mockRepo))

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).once()

      const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

      expect(result).toThrow(LockRundownException)
    })

    it('Throw error if we call 2 different actions without any time between', async () => {
      const mockRepo: RundownLockService = mock<RundownLockService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)

      when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: RundownLockService = new RundownLockService(instance(mockRepo))

      await testee.activateRundown(randomRundown.id)

      verify(mockRepo.activateRundown(randomRundownId)).once()

      const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

      expect(result).toThrow(LockRundownException)
    })

    it('Throw error if we call 2 different actions with 499 ms time between', async () => {
      const mockRepo: RundownLockService = mock<RundownLockService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
      const now: number = Date.now()

      jest.useFakeTimers().setSystemTime(now)

      when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: RundownLockService = new RundownLockService(instance(mockRepo))

      await testee.activateRundown(randomRundown.id)

      verify(mockRepo.activateRundown(randomRundownId)).once()

      jest.advanceTimersByTime(499)

      const result: () => Promise<void> = () => testee.takeNext(randomRundown.id)

      expect(result).toThrow(LockRundownException)
    })
  })

  describe('Rundown lock success cases', () => {
    it('2 success calls to takeNext with 500ms between', async () => {
      const mockRepo: RundownLockService = mock<RundownLockService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
      const now: number = Date.now()

      jest.useFakeTimers().setSystemTime(now)

      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: RundownLockService = new RundownLockService(instance(mockRepo))

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).once()

      jest.advanceTimersByTime(500)

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).times(2)
    })

    it('2 success calls to 2 different actions with 500ms between', async () => {
      const mockRepo: RundownLockService = mock<RundownLockService>()
      const randomRundownId: string = 'randomRundownId'
      const randomRundown: Rundown = new Rundown({ id: randomRundownId } as RundownInterface)
      const now: number = Date.now()
      
      jest.useFakeTimers().setSystemTime(now)

      when(mockRepo.activateRundown(randomRundownId)).thenReturn(Promise.resolve())
      when(mockRepo.takeNext(randomRundownId)).thenReturn(Promise.resolve())

      const testee: RundownLockService = new RundownLockService(instance(mockRepo))

      await testee.activateRundown(randomRundown.id)

      verify(mockRepo.activateRundown(randomRundownId)).once()

      jest.advanceTimersByTime(500)

      await testee.takeNext(randomRundown.id)

      verify(mockRepo.takeNext(randomRundownId)).once()
    })
  })
})
