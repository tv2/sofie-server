import { anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown } from '../../../model/entities/rundown'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownTimelineService } from '../rundown-timeline-service'
import { CallbackScheduler } from '../interfaces/callback-scheduler'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Blueprint } from '../../../model/value-objects/blueprint'
import { PartRepository } from '../../../data-access/repositories/interfaces/part-repository'
import { SegmentRepository } from '../../../data-access/repositories/interfaces/segment-repository'
import { PieceRepository } from '../../../data-access/repositories/interfaces/piece-repository'
import { IngestedRundownRepository } from '../../../data-access/repositories/interfaces/ingested-rundown-repository'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { AlreadyActivatedException } from '../../../model/exceptions/already-activated-exception'
import { ActiveRundownException } from '../../../model/exceptions/active-rundown-exception'
import { Owner } from '../../../model/enums/owner'
import { Segment } from '../../../model/entities/segment'
import { Timeline } from '../../../model/entities/timeline'
import { TimelineObject, TimelineObjectGroup } from '../../../model/entities/timeline-object'

describe(RundownTimelineService.name, () => {
  describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
    it('deletes a rundown, when it receives a valid RundownId', async () => {
      const mockIngestedRundownRepository: IngestedRundownRepository = mock<IngestedRundownRepository>()

      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ ingestedRundownRepository: instance(mockIngestedRundownRepository), rundownRepository: instance(mockRundownRepository) })

      await testee.deleteRundown(rundown.id)

      verify(mockIngestedRundownRepository.deleteIngestedRundown(rundown.id)).once()
    })

    it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })
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

      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: true })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      await expect(() => testee.deleteRundown(rundown.id)).rejects.toThrow(ActiveRundownException)
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('throws an exception, when trying to active a rundown when there is another already activated rundown', async () => {
      const activeBasicRundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: true })
      const basicRundowns: Rundown[] = [activeBasicRundown]
      const rundownToActivate: Rundown = EntityMockFactory.createRundown({id: 'inactiveRundown', isRundownActive: false})
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundowns)
      const testee: RundownTimelineService = createTestee({rundownRepository: instance(mockRundownRepository)})

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.name)

      await expect(result).rejects.toThrow(AlreadyActivatedException)
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless piecess are changed', async () => {
      const aRundown: Rundown = EntityMockFactory.createRundown({ id: 'aRundown', isRundownActive: false })
      const rundowns: Rundown[] = [aRundown]
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      when(mockRundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(mockRundownRepository.getBasicRundowns()).thenResolve(rundowns)
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository: instance(mockRundownRepository),
        rundownEventEmitter: instance(mockRundownEventEmitter),
      })

      await testee.activateRundown('aRundown')
      verify(mockRundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
    })
  })

  describe(`${RundownTimelineService.prototype.takeNext.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless piecess are changed', async () => {
      const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
      const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', pieces: [activePiece] })
      const firstSegment: Segment = EntityTestFactory.createSegment({parts: [activePart]})
      const secondSegment: Segment = EntityTestFactory.createSegment({parts: [nextPart]})
      const segments: Segment[] = [firstSegment, secondSegment]
      const aRundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        isRundownActive: true,
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
    it('does not emit infinitePiecesUpdatedEvent unless piecess are changed', async () => {
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
  })
})

function createTestee(params: {
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
    params.rundownEventEmitter ?? instance(mock<RundownEventEmitter>()),
    params.ingestedRundownRepository ?? instance(mock<IngestedRundownRepository>()),
    params.rundownRepository ?? instance(mock<RundownRepository>()),
    params.segmentRepository ?? instance(mock<SegmentRepository>()),
    params.partRepository ?? instance(mock<PartRepository>()),
    params.pieceRepository ?? instance(mock<PieceRepository>()),
    params.timelineRepository ?? instance(mock<TimelineRepository>()),
    params.timelineBuilder ?? instance(mock<TimelineBuilder>()),
    params.callbackScheduler ?? instance(mock<CallbackScheduler>()),
    params.blueprint ?? instance(mock<Blueprint>())
  )
}
