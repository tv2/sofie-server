import { anything, capture, instance, mock, verify, when } from '@typestrong/ts-mockito'
import { Rundown } from '../../../model/entities/rundown'
import { RundownEventEmitter } from '../interfaces/rundown-event-emitter'
import { RundownRepository } from '../../../data-access/repositories/interfaces/rundown-repository'
import { TimelineRepository } from '../../../data-access/repositories/interfaces/timeline-repository'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { ActiveRundownException } from '../../../model/exceptions/active-rundown-exception'
import { IngestEventType } from '../../../model/enums/event-type'
import { RundownTimelineService } from '../rundown-timeline-service'
import { CallbackScheduler } from '../interfaces/callback-scheduler'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { RundownDeletedEvent } from '../../../model/value-objects/rundown-event'
import { Blueprint } from '../../../model/value-objects/blueprint'
import { PartRepository } from '../../../data-access/repositories/interfaces/part-repository'
import { SegmentRepository } from '../../../data-access/repositories/interfaces/segment-repository'
import { PieceRepository } from '../../../data-access/repositories/interfaces/piece-repository'

describe(RundownTimelineService.name, () => {
  describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
    it('deletes a rundown, when it receives a valid RundownId', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      await testee.deleteRundown(rundown.id)

      verify(mockRundownRepository.deleteRundown(rundown.id)).once()
    })

    it('builds a rundown deleted event, when it receives a valid RundownId', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()
      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      when(mockRundownEventBuilder.buildRundownDeletedEvent(anything())).thenReturn(
        createDeletedRundownEvent(rundown.id)
      )

      const testee: RundownTimelineService = createTestee({
        rundownRepository: instance(mockRundownRepository),
        rundownEventBuilder: instance(mockRundownEventBuilder),
      })

      await testee.deleteRundown(rundown.id)

      verify(mockRundownEventBuilder.buildRundownDeletedEvent(anything())).once()
    })

    it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()
      const mockRundownEventBuilder: RundownEventBuilder = mock<RundownEventBuilder>()
      const mockRundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: false })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      when(mockRundownEventBuilder.buildRundownDeletedEvent(anything())).thenReturn(
        createDeletedRundownEvent(rundown.id)
      )

      const testee: RundownTimelineService = createTestee({
        rundownRepository: instance(mockRundownRepository),
        rundownEventEmitter: instance(mockRundownEventEmitter),
        rundownEventBuilder: instance(mockRundownEventBuilder),
      })

      await testee.deleteRundown(rundown.id)
      const [rundownEvent] = capture(mockRundownEventEmitter.emitRundownEvent).last()
      expect(rundownEvent.type).toBe(IngestEventType.RUNDOWN_DELETED)
    })

    it('throws an exception, when it receives a RundownId of an active rundown', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()

      const rundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: true })

      when(mockRundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ rundownRepository: instance(mockRundownRepository) })

      await expect(() => testee.deleteRundown(rundown.id)).rejects.toThrow(ActiveRundownException)
    })
  })
})

function createDeletedRundownEvent(rundownId: string): RundownDeletedEvent {
  return {
    type: IngestEventType.RUNDOWN_DELETED,
    timestamp: Date.now(),
    rundownId: rundownId,
  }
}

function createTestee(params: {
  rundownEventEmitter?: RundownEventEmitter
  rundownRepository?: RundownRepository
  segmentRepository?: SegmentRepository
  partRepository?: PartRepository
  pieceRepository?: PieceRepository
  timelineRepository?: TimelineRepository
  timelineBuilder?: TimelineBuilder
  rundownEventBuilder?: RundownEventBuilder
  callbackScheduler?: CallbackScheduler
  blueprint?: Blueprint
}): RundownTimelineService {
  return new RundownTimelineService(
    params.rundownEventEmitter ?? instance(mock<RundownEventEmitter>()),
    params.rundownRepository ?? instance(mock<RundownRepository>()),
    params.segmentRepository ?? instance(mock<SegmentRepository>()),
    params.partRepository ?? instance(mock<PartRepository>()),
    params.pieceRepository ?? instance(mock<PieceRepository>()),
    params.timelineRepository ?? instance(mock<TimelineRepository>()),
    params.timelineBuilder ?? instance(mock<TimelineBuilder>()),
    params.rundownEventBuilder ?? instance(mock<RundownEventBuilder>()),
    params.callbackScheduler ?? instance(mock<CallbackScheduler>()),
    params.blueprint ?? instance(mock<Blueprint>())
  )
}
