import { ThrottledRundownService } from '../throttled-rundown-service'
import { anything, instance, mock, verify } from '@typestrong/ts-mockito'
import { ThrottledRundownException } from '../../../model/exceptions/throttled-rundown-exception'
import { RundownService } from '../interfaces/rundown-service'

describe(ThrottledRundownService.name, () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())
  describe('when two operations are performed within the throttled interval', () => {
    describe('throws an error to second operation', () => {
      it('throws error when two take nexts are performed with 0ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.takeNext(anything())

        const result: () => Promise<void> = () => testee.takeNext(anything())

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two different actions are performed with 0ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.activateRundown(anything())

        const result: () => Promise<void> = () => testee.takeNext(anything())

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two take nexts are performed with 499ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()
        const now: number = Date.now()

        jest.setSystemTime(now)

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.takeNext(anything())

        jest.advanceTimersByTime(499)

        const result: () => Promise<void> = () => testee.takeNext(anything())

        expect(result).toThrow(ThrottledRundownException)
      })
    })
  })

  describe('when two operations are performed outside of a throttled interval', () => {
    it('performed two take nexts with 500ms between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()
      const now: number = Date.now()
      jest.setSystemTime(now)

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.takeNext(anything())

      jest.advanceTimersByTime(500)

      await testee.takeNext(anything())

      verify(mockRundownService.takeNext(anything())).times(2)
    })

    it('performed two different operations with 500ms between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()
      const now: number = Date.now()

      jest.setSystemTime(now)

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.activateRundown(anything())

      jest.advanceTimersByTime(500)

      await testee.takeNext(anything())

      verify(mockRundownService.takeNext(anything())).once()
    })
  })

  describe('when performed operations witch should not have throttled mechanism', () => {
    it('performed two insert part as next operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.insertPartAsNext(anything(), anything())

      await testee.insertPartAsNext(anything(), anything())
      verify(mockRundownService.insertPartAsNext(anything(), anything())).times(2)
    })

    it('performed two insert part as on air operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.insertPartAsOnAir(anything(), anything())

      await testee.insertPartAsOnAir(anything(), anything())

      verify(mockRundownService.insertPartAsOnAir(anything(), anything())).times(2)
    })

    it('performed two replace piece on air on next part operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.replacePieceOnAirOnNextPart(anything(), anything(), anything())

      await testee.replacePieceOnAirOnNextPart(anything(), anything(), anything())

      verify(mockRundownService.replacePieceOnAirOnNextPart(anything(), anything(), anything())).times(2)
    })
  })
})
