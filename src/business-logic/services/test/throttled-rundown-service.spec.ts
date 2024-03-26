import { ThrottledRundownService } from '../throttled-rundown-service'
import { anything, instance, mock, verify } from '@typestrong/ts-mockito'
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
        const rundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'

        const testee: ThrottledRundownService = createTestee({ rundownService })

        await testee.takeNext(rundownId)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two different actions are performed with 0ms delay', async () => {
        const rundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'

        const testee: ThrottledRundownService = createTestee({ rundownService })

        await testee.resetRundown(rundownId)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })

      it('throws error when two take nexts are performed with 499ms delay', async () => {
        const rundownService: RundownService = mock<RundownService>()

        const rundownId: string = 'rundown-id'
        const now: number = Date.now()

        jest.setSystemTime(now)

        const testee: ThrottledRundownService = createTestee({ rundownService })

        await testee.takeNext(rundownId)

        jest.advanceTimersByTime(499)

        const result: () => Promise<void> = () => testee.takeNext(rundownId)

        expect(result).toThrow(ThrottledRundownException)
      })
    })
  })

  describe('when two operations are performed outside of a throttled interval', () => {
    it('performed two take nexts with 500ms between', async () => {
      const rundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const now: number = Date.now()

      jest.setSystemTime(now)

      const testee: ThrottledRundownService = createTestee({ rundownService })

      await testee.takeNext(rundownId)

      jest.advanceTimersByTime(500)

      await testee.takeNext(rundownId)

      verify(rundownService.takeNext(rundownId)).times(2)
    })

    it('performed two different operations with 500ms between', async () => {
      const rundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const now: number = Date.now()

      jest.setSystemTime(now)

      const testee: ThrottledRundownService = createTestee({ rundownService })

      await testee.activateRundown(rundownId)

      jest.advanceTimersByTime(500)

      await testee.takeNext(rundownId)

      verify(rundownService.takeNext(rundownId)).once()
    })
  })

  describe('when performed operations witch should not have throttled mechanism', () => {
    it('performed two insert part as next operations without any time between', async () => {
      const rundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const firstPartToInsert: Part = EntityTestFactory.createPart()
      const secondPartToInsert: Part = EntityTestFactory.createPart()

      const testee: ThrottledRundownService = createTestee({ rundownService })

      await testee.insertPartAsNext(rundownId, firstPartToInsert)

      await testee.insertPartAsNext(rundownId, secondPartToInsert)

      verify(rundownService.insertPartAsNext(rundownId, secondPartToInsert)).calledAfter(rundownService.insertPartAsNext(rundownId, firstPartToInsert))
    })

    it('performed two insert part as on air operations without any time between', async () => {
      const rundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const partToInsert: Part = EntityTestFactory.createPart()

      const testee: ThrottledRundownService = createTestee({ rundownService })

      await testee.insertPartAsOnAir(rundownId, partToInsert)

      await testee.insertPartAsOnAir(rundownId, partToInsert)

      verify(rundownService.insertPartAsOnAir(rundownId, partToInsert)).times(2)
    })

    it('performed two replace piece on air on next part operations without any time between', async () => {
      const rundownService: RundownService = mock<RundownService>()

      const rundownId: string = 'rundown-id'
      const pieceToBeReplaced: Piece = EntityTestFactory.createPiece()
      const newPiece: Piece = EntityTestFactory.createPiece()

      const testee: ThrottledRundownService = createTestee({ rundownService })

      await testee.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)

      await testee.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)

      verify(rundownService.replacePieceOnAirOnNextPart(rundownId, pieceToBeReplaced, newPiece)).times(2)
    })
  })

  describe(ThrottledRundownService.prototype.takeNext.name, () => {
    it('calls TakeNext on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.takeNext('rundownId')
      verify(rundownService.takeNext(anything())).once()
    })

    it('throws ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.takeNext('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.takeNext('rundownId')).toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.activateRundown.name, () => {
    it('calls ActivateRundown on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.activateRundown('rundownId')
      verify(rundownService.activateRundown(anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.activateRundown('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.activateRundown('rundownId')).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.deactivateRundown.name, () => {
    it('calls DeactivateRundown on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.deactivateRundown('rundownId')
      verify(rundownService.deactivateRundown(anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.deactivateRundown('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.deactivateRundown('rundownId')).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.resetRundown.name, () => {
    it('calls ResetRundown on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.resetRundown('rundownId')
      verify(rundownService.resetRundown(anything())).once()
    })

    it('throws ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.resetRundown('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.resetRundown('rundownId')).toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.enterRehearsal.name, () => {
    it('calls EnterRehearsal on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.enterRehearsal('rundownId')
      verify(rundownService.enterRehearsal(anything())).once()
    })

    it('throws ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.enterRehearsal('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.enterRehearsal('rundownId')).toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.deleteRundown.name, () => {
    it('calls DeleteRundown on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.deleteRundown('rundownId')
      verify(rundownService.deleteRundown(anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.deleteRundown('rundownId')
      jest.advanceTimersByTime(5)
      expect(() => testee.deleteRundown('rundownId')).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.setNext.name, () => {
    it('calls SetNext on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.setNext('rundownId', 'segmentId', 'partId')
      verify(rundownService.setNext(anything(), anything(), anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.setNext('rundownId', 'segmentId', 'partId')
      jest.advanceTimersByTime(5)
      expect(() => testee.setNext('rundownId', 'segmentId', 'partId')).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.insertPartAsOnAir.name, () => {
    it('calls InsertPartAsOnAir on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.insertPartAsNext('rundownId', EntityTestFactory.createPart())
      verify(rundownService.insertPartAsNext(anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.insertPartAsOnAir('rundownId', EntityTestFactory.createPart())
      jest.advanceTimersByTime(5)
      expect(() => testee.insertPartAsOnAir('rundownId', EntityTestFactory.createPart())).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.insertPartAsNext.name, () => {
    it('calls InsertPartAsNext on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.insertPartAsNext('rundownId', EntityTestFactory.createPart())
      verify(rundownService.insertPartAsNext(anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.insertPartAsNext('rundownId', EntityTestFactory.createPart())
      jest.advanceTimersByTime(5)
      expect(() => testee.insertPartAsNext('rundownId', EntityTestFactory.createPart())).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.insertPieceAsOnAir.name, () => {
    it('calls InsertPieceAsOnAir on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.insertPieceAsOnAir('rundownId', EntityTestFactory.createPiece())
      verify(rundownService.insertPieceAsOnAir(anything(), anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.insertPieceAsOnAir('rundownId', EntityTestFactory.createPiece())
      jest.advanceTimersByTime(5)
      expect(() => testee.insertPieceAsOnAir('rundownId', EntityTestFactory.createPiece())).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.insertPieceAsNext.name, () => {
    it('calls InsertPieceAsNext on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.insertPieceAsNext('rundownId', EntityTestFactory.createPiece())
      verify(rundownService.insertPieceAsNext(anything(), anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.insertPieceAsNext('rundownId', EntityTestFactory.createPiece())
      jest.advanceTimersByTime(5)
      expect(() => testee.insertPieceAsNext('rundownId', EntityTestFactory.createPiece())).not.toThrow(ThrottledRundownException)
    })
  })

  describe(ThrottledRundownService.prototype.replacePieceOnAirOnNextPart.name, () => {
    it('calls ReplacePieceOAirOnNextPart on the RundownService', async () => {
      const rundownService: RundownService = mock<RundownService>()
      const testee: ThrottledRundownService = createTestee({ rundownService })
      await testee.replacePieceOnAirOnNextPart('rundownId', EntityTestFactory.createPiece(), EntityTestFactory.createPiece())
      verify(rundownService.replacePieceOnAirOnNextPart(anything(), anything(), anything())).once()
    })

    it('does not throw ThrottleRundownException if called twice in succession', async () => {
      const testee: ThrottledRundownService = createTestee()
      await testee.replacePieceOnAirOnNextPart('rundownId', EntityTestFactory.createPiece(), EntityTestFactory.createPiece())
      jest.advanceTimersByTime(5)
      expect(() => testee.replacePieceOnAirOnNextPart('rundownId', EntityTestFactory.createPiece(), EntityTestFactory.createPiece())).not.toThrow(ThrottledRundownException)
    })
  })
})

function createTestee(params?: {
  rundownService: RundownService
}): ThrottledRundownService {
  return new ThrottledRundownService(instance(params?.rundownService ?? mock<RundownService>()))
}
