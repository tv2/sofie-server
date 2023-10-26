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
import {AlreadyActivatedException} from "../../../model/exceptions/already-activated-exception";

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

    it('throws an exception, when trying to active a rundown when there is another already activated rundown', async () => {
      const mockRundownRepository: RundownRepository = mock<RundownRepository>()

      const activeBasicRundown: Rundown = EntityMockFactory.createRundown({ isRundownActive: true })

      const basicRundownArray: Rundown[] = [activeBasicRundown];

      const rundownToActivate: Rundown = EntityMockFactory.createRundown({isRundownActive: false})

      when(mockRundownRepository.getBasicRundowns()).thenResolve(basicRundownArray)

      const testee: RundownTimelineService = createTestee({rundownRepository: instance(mockRundownRepository)})

      await expect(() => testee.activateRundown(rundownToActivate.name)).rejects.toThrow(AlreadyActivatedException)
    })
  })
})

function createTestee(params: {
  rundownEventEmitter?: RundownEventEmitter
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
