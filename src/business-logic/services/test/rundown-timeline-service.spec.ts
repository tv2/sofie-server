import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown } from '../../../model/entities/rundown'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { ActiveRundownException } from '../../../model/exceptions/active-rundown-exception'
import { RundownTimelineService } from '../rundown-timeline-service'
import { CallbackScheduler } from '../interfaces/callback-scheduler'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Blueprint } from '../../../model/value-objects/blueprint'
import { PartRepository } from '../../../data-access/repositories/interfaces/part-repository'
import { SegmentRepository } from '../../../data-access/repositories/interfaces/segment-repository'
import { PieceRepository } from '../../../data-access/repositories/interfaces/piece-repository'
import { AlreadyActivatedException } from '../../../model/exceptions/already-activated-exception'
import { IngestedRundownRepository } from '../../../data-access/repositories/interfaces/ingested-rundown-repository'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Owner } from '../../../model/enums/owner'
import { Segment } from '../../../model/entities/segment'
import { Timeline } from '../../../model/entities/timeline'
import { TimelineObject, TimelineObjectGroup } from '../../../model/entities/timeline-object'
import { RundownMode } from '../../../model/enums/rundown-mode'
import { AlreadyRehearsalException } from '../../../model/exceptions/already-rehearsal-exception'

describe(RundownTimelineService.name, () => {
  describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
    it('deletes a rundown, when it receives a valid RundownId', async () => {
      const mockIngestedRundownRepository: IngestedRundownRepository = mock<IngestedRundownRepository>()

      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.INACTIVE })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ ingestedRundownRepository: instance(mockIngestedRundownRepository), rundownRepository: instance(mockRundownRepository) })

      await testee.deleteRundown(rundown.id)

      verify(mockIngestedRundownRepository.deleteIngestedRundown(rundown.id)).once()
    })

    it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.INACTIVE })
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository: instance(mockRundownRepository),
        rundownEventEmitter: instance(mockRundownEventEmitter),
      })

      await testee.deleteRundown(rundown.id)

      verify(mockRundownEventEmitter.emitRundownDeleted(anything())).once()
    })

    it('throws an exception, when it receives a RundownId of an active rundown', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()

      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.ACTIVE })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      await expect(() => testee.deleteRundown(rundown.id)).rejects.toThrow(ActiveRundownException)
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('throws an exception, when trying to active a rundown when there is another already activated rundown', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.ACTIVE })]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToActivate: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })
      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      await expect(result).rejects.toThrow(AlreadyActivatedException)
    })

    it('throws an exception when trying to active a Rundown when there is another Rundown in rehearsal', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToActivate: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      await expect(result).rejects.toThrow(AlreadyRehearsalException)
    })

    it('does not throw an AlreadyRehearsalException when trying to activate a Rundown that is in rehearsal', () => {
      const rundownToActivate: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })

      const basicRundowns: Rundown[] = [rundownToActivate]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)
      when(mockRundownRepository.getRundown(rundownToActivate.id)).thenResolve(rundownToActivate)


      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      expect(result).not.toThrow(AlreadyRehearsalException)
    })
  })

  describe(`${RundownTimelineService.prototype.enterRehearsal.name}`, () => {
    it('throws an exception when trying to enter rehearsal on a Rundown when another Rundown is already active', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.ACTIVE })]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToEnterRehearsal: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })
      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      const result: () => Promise<void> = () => testee.enterRehearsal(rundownToEnterRehearsal.id)

      await expect(result).rejects.toThrow(AlreadyActivatedException)
    })

    it('throws an exception when trying to enter rehearsal on a Rundown when another Rundown is already in rehearsal', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToEnterRehearsal: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      const result: () => Promise<void> = () => testee.enterRehearsal(rundownToEnterRehearsal.id)

      await expect(result).rejects.toThrow(AlreadyRehearsalException)
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless piecess are changed', async () => {
      const aRundownMock: Rundown = EntityMockFactory.createRundownMock({ id: 'aRundown', mode: RundownMode.INACTIVE })
      const firstLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'samePieceId' })
      const secondLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'samePieceId' })
      const firstMap: Map<string, Piece> = new Map<string, Piece>([['firstLayer',firstLayerPiece]])
      const secondMap: Map<string, Piece> = new Map<string, Piece>([['firstLayer',secondLayerPiece]])
      const aRundown: Rundown = instance(aRundownMock)
      when(aRundownMock.getInfinitePiecesMap()).thenReturn(firstMap).thenReturn(secondMap)
      const rundowns: Rundown[] = [aRundown]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(mockRundownRepository.getBasicRundowns()).thenResolve(rundowns)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
      const mockRundownRepositoryInstance: RundownRepository = instance(mockRundownRepository)
      const mockRundownEventEmitterInstance: RundownEventEmitter = instance(mockRundownEventEmitter)
      const testee: RundownTimelineService = createTestee({
        rundownRepository: mockRundownRepositoryInstance,
        rundownEventEmitter: mockRundownEventEmitterInstance,
      })

      await testee.activateRundown('aRundown')
      verify(mockRundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('emits infinitePiecesUpdatedEvent when pieces are changed', async () => {
      const aRundownMock: Rundown = EntityMockFactory.createRundownMock({ id: 'aRundown', mode: RundownMode.INACTIVE })
      const firstLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'firstLayerPiece' })
      const secondLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'secondLayerPiece' })
      const firstMap: Map<string, Piece> = new Map<string, Piece>([['firstLayer',firstLayerPiece]])
      const secondMap: Map<string, Piece> = new Map<string, Piece>([['firstLayer',secondLayerPiece]])
      const aRundown: Rundown = instance(aRundownMock)
      when(aRundownMock.getInfinitePiecesMap()).thenReturn(firstMap).thenReturn(secondMap)
      const rundowns: Rundown[] = [aRundown]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(mockRundownRepository.getBasicRundowns()).thenResolve(rundowns)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
      const mockRundownRepositoryInstance: RundownRepository = instance(mockRundownRepository)
      const mockRundownEventEmitterInstance: RundownEventEmitter = instance(mockRundownEventEmitter)
      const testee: RundownTimelineService = createTestee({
        rundownRepository: mockRundownRepositoryInstance,
        rundownEventEmitter: mockRundownEventEmitterInstance,
      })

      await testee.activateRundown('aRundown')
      verify(mockRundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).once()
    })
  })

  describe(`${RundownTimelineService.prototype.takeNext.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless pieces are changed', async () => {
      const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
      const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', pieces: [activePiece] })
      const firstSegment: Segment = EntityTestFactory.createSegment({parts: [activePart]})
      const secondSegment: Segment = EntityTestFactory.createSegment({parts: [nextPart]})
      const segments: Segment[] = [firstSegment, secondSegment]
      const aRundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            segment: firstSegment,
            part: activePart,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            segment: secondSegment,
            part: nextPart,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map()
        },
      })
      const aRundownRepo: RundownRepository = mock<RundownRepository>()
      when(aRundownRepo.getRundown(aRundown.id)).thenResolve(aRundown)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
      const mockTimeLineObject: TimelineObject = mock<TimelineObject>()
      const mockTimeLineObjects: TimelineObject[] = [mockTimeLineObject]
      const mockTimelineObjectGroup: TimelineObjectGroup = mock<TimelineObjectGroup>({isGroup: true, children:mockTimeLineObjects})
      const mockTimeline: Timeline = mock<Timeline>({
        mockTimelineObjectGroup: instance(mockTimelineObjectGroup)
      })
      const mockTimelineBuilder: TimelineBuilder = mock<TimelineBuilder>()
      when(mockTimelineBuilder.buildTimeline(aRundown)).thenResolve(mockTimeline)
      const testee: RundownTimelineService = createTestee({
        rundownEventEmitter: instance(mockRundownEventEmitter),
        rundownRepository: instance(aRundownRepo),
        timelineBuilder: instance(mockTimelineBuilder),
      })

      await testee.takeNext(aRundown.id)
      verify(mockRundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
    })
  })

  describe(`${RundownTimelineService.prototype.insertPartAsOnAir.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless pieces are changed', async () => {
      const aPiece: Piece = EntityTestFactory.createPiece({id: 'aPieceId'})
      const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
      const activeSegment: Segment = EntityTestFactory.createSegment({parts: [activePart]})
      const activePartInfinitePiecesMap: Map<string, Piece> = new Map<string, Piece>([['activeLayerId', activePiece]])
      const previousPiece: Piece = EntityTestFactory.createPiece({id: 'previousPieceId'})
      const previousPart: Part = EntityTestFactory.createPart({ id: 'previousPart', pieces: [previousPiece] })
      const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', pieces: [aPiece] })
      const nextSegment: Segment = EntityTestFactory.createSegment({parts: [nextPart]})
      const aRundown: Rundown = EntityMockFactory.createActiveRundown({
        activePart: activePart,
        nextPart: nextPart,
        previousPart: previousPart,
        activeSegment: activeSegment,
        nextSegment: nextSegment,
        infinitePiecesMap: activePartInfinitePiecesMap,
      })
      const basicRundowns: Rundown[] = [aRundown]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
      const testee: RundownTimelineService = createTestee({
        rundownRepository: instance(mockRundownRepository),
        rundownEventEmitter: instance(mockRundownEventEmitter),
      })
      await testee.insertPieceAsOnAir(aRundown.id, aPiece)
      verify(mockRundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
    })

    it('inserts the new Part as OnAir', async () => {
      const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })

      const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPart' })
      const onAirSegment: Segment = EntityTestFactory.createSegment({ id: 'onAirSegment', parts: [onAirPart] })

      const rundown: Rundown = EntityTestFactory.createRundown({
        segments: [onAirSegment]
      })
      rundown.activate()
      rundown.takeNext()

      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(rundownRepository) })

      expect(rundown.getActivePart().id).not.toBe(partToBeInserted.id)

      await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

      expect(rundown.getActivePart().id).toBe(partToBeInserted.id)
    })

    describe('there is already an unplanned Part queued as Next', () => {
      it('keeps the unplanned Part as the Next Part', async () => {
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })

        const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPart' })
        const onAirSegment: Segment = EntityTestFactory.createSegment({ id: 'onAirSegment', parts: [onAirPart], rank: 1 })

        const unplannedNextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', ingestedPart: undefined })

        const rundown: Rundown = EntityTestFactory.createRundown({
          segments: [onAirSegment]
        })
        rundown.activate()
        rundown.takeNext()

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const testee: RundownTimelineService = createTestee({ rundownRepository: instance(rundownRepository) })

        // We need to insert the unplanned Part as next before we execute the 'insertPartAsOnAir' method that we want to test.
        await testee.insertPartAsNext(rundown.id, unplannedNextPart)
        expect(rundown.getNextPart().id).toBe(unplannedNextPart.id)

        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)
        expect(rundown.getNextPart().id).toBe(unplannedNextPart.id)
      })
    })

    describe('the Next Part is a planned Part', () => {
      it('keeps the planned Part as the Next Part', async () => {
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })

        const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPart' })
        const onAirSegment: Segment = EntityTestFactory.createSegment({ id: 'onAirSegment', parts: [onAirPart], rank: 1 })

        const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
        const nextSegment: Segment = EntityTestFactory.createSegment({ id: 'nextSegment', parts: [nextPart], rank: 2 })

        const rundown: Rundown = EntityTestFactory.createRundown({
          segments: [onAirSegment, nextSegment]
        })
        rundown.activate()
        rundown.takeNext()

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const testee: RundownTimelineService = createTestee({ rundownRepository: instance(rundownRepository) })

        expect(rundown.getNextPart().id).toBe(nextPart.id)

        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        expect(rundown.getNextPart().id).toBe(nextPart.id)
      })
    })
  })
})

function createTestee(params?: {
  rundownEventEmitter?: RundownEventEmitter
  ingestedRundownRepository?: IngestedRundownRepository
  rundownRepository?: RundownRepository
  segmentRepository?: SegmentRepository
  partRepository?: PartRepository
  pieceRepository?: PieceRepository
  timelineRepository?: TimelineRepository
  timelineBuilder?: TimelineBuilder
  callbackScheduler?: CallbackScheduler
  blueprint?: Blueprint
}): RundownTimelineService {
  return new RundownTimelineService(
    params?.rundownEventEmitter ?? instance(mock<RundownEventEmitter>()),
    params?.ingestedRundownRepository ?? instance(mock<IngestedRundownRepository>()),
    params?.rundownRepository ?? instance(mock<RundownRepository>()),
    params?.segmentRepository ?? instance(mock<SegmentRepository>()),
    params?.partRepository ?? instance(mock<PartRepository>()),
    params?.pieceRepository ?? instance(mock<PieceRepository>()),
    params?.timelineRepository ?? instance(mock<TimelineRepository>()),
    params?.timelineBuilder ?? instance(mock<TimelineBuilder>()),
    params?.callbackScheduler ?? instance(mock<CallbackScheduler>()),
    params?.blueprint ?? instance(mock<Blueprint>())
  )
}
