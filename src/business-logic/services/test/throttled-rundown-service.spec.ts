import { ThrottledRundownService } from '../throttled-rundown-service'
import { instance, mock, verify } from '@typestrong/ts-mockito'
import { ThrottledRundownException } from '../../../model/exceptions/throttled-rundown-exception'
import { RundownService } from '../interfaces/rundown-service'
import { Part } from '../../../model/entities/part'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Piece } from '../../../model/entities/piece'

describe(ThrottledRundownService.name, () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  describe('when two operations are performed within the throttled interval', () => {
    describe('throws an error to second operation', () => {
      it('throws error when two take nexts are performed with 0ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.takeNext(rundownId)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two different actions are performed with 0ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.activateRundown(rundownId)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two take nexts are performed with 499ms delay', async () => {
        const mockRundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'
        const now: number = Date.now()

        jest.setSystemTime(now)

        const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

        await testee.takeNext(rundownId)

        jest.advanceTimersByTime(499)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })
    })
  })

  describe('when two operations are performed outside of a throttled interval', () => {
    it('performed two take nexts with 500ms between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const now: number = Date.now()

      jest.setSystemTime(now)

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.takeNext(rundownId)

      jest.advanceTimersByTime(500)

      await testee.takeNext(rundownId)

      verify(mockRundownService.takeNext(rundownId)).times(2)
    })

    it('performed two different operations with 500ms between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const now: number = Date.now()

      jest.setSystemTime(now)

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.activateRundown(rundownId)

      jest.advanceTimersByTime(500)

      await testee.takeNext(rundownId)

      verify(mockRundownService.takeNext(rundownId)).once()
    })
  })

  describe('when performed operations witch should not have throttled mechanism', () => {
    it('performed two insert part as next operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const firstPartToInsert: Part = EntityTestFactory.createPart()
      const secondPartToInsert: Part = EntityTestFactory.createPart()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.insertPartAsNext(rundownId, firstPartToInsert)

      await testee.insertPartAsNext(rundownId, secondPartToInsert)

      verify(mockRundownService.insertPartAsNext(rundownId, secondPartToInsert)).calledAfter(mockRundownService.insertPartAsNext(rundownId, firstPartToInsert))
    })

    it('performed two insert part as on air operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const partToInsert: Part = EntityTestFactory.createPart()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.insertPartAsOnAir(rundownId, partToInsert)

      await testee.insertPartAsOnAir(rundownId, partToInsert)

      verify(mockRundownService.insertPartAsOnAir(rundownId, partToInsert)).times(2)
    })

    it('performed two replace piece on air on next part operations without any time between', async () => {
      const mockRundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const pieceToBeReplaced: Piece = EntityTestFactory.createPiece()
      const newPiece: Piece = EntityTestFactory.createPiece()

      const testee: ThrottledRundownService = new ThrottledRundownService(instance(mockRundownService))

      await testee.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)

      await testee.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)

      verify(mockRundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)).times(2)
    })
  })
})
