import { anyString, anything, instance, mock, verify, when } from '@typestrong/ts-mockito'
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
import { IngestService } from '../interfaces/ingest-service'
import { RundownService } from '../interfaces/rundown-service'
import { Logger } from '../../../logger/logger'
import { PlayoutService } from '../interfaces/playoutService'
import { InTransition } from '../../../model/value-objects/in-transition'
import { TakeIsBlockedException } from '../../../model/exceptions/take-is-blocked-exception'
import { UnsupportedOperationException } from '../../../model/exceptions/unsupported-operation-exception'
import { TakeMode } from '../../../model/enums/take-mode'
import { PlayoutContentUpdateService } from '../interfaces/playout-content-service'

describe(RundownTimelineService.name, () => {
  describe(`${RundownTimelineService.prototype.deleteRundown.name}`, () => {
    it('deletes a rundown, when it receives a valid RundownId', async () => {
      const ingestedRundownRepository: IngestedRundownRepository = mock<IngestedRundownRepository>()

      const rundownRepository: RundownRepository = mock<RundownRepository>()
      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.INACTIVE })

      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ ingestedRundownRepository, rundownRepository })

      await testee.deleteRundown(rundown.id)

      verify(ingestedRundownRepository.deleteIngestedRundown(rundown.id)).once()
    })

    it('emits a rundown deleted event, when it receives a valid RundownId', async () => {
      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.INACTIVE })
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository,
        rundownEventEmitter,
      })

      await testee.deleteRundown(rundown.id)

      verify(rundownEventEmitter.emitRundownDeleted(anything())).once()
    })

    it('throws an exception, when it receives a RundownId of an active rundown', async () => {
      const rundownRepository: RundownRepository = mock<RundownRepository>()

      const rundown: Rundown = EntityMockFactory.createRundown({ mode: RundownMode.ACTIVE })

      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const testee: RundownTimelineService = createTestee({ rundownRepository })

      await expect(() => testee.deleteRundown(rundown.id)).rejects.toThrow(ActiveRundownException)
    })
  })

  describe(`${RundownTimelineService.prototype.activateRundown.name}`, () => {
    it('throws an exception, when trying to active a rundown when there is another already activated rundown', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.ACTIVE })]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToActivate: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })
      const testee: RundownTimelineService = createTestee({ rundownRepository })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      await expect(result).rejects.toThrow(AlreadyActivatedException)
    })

    it('throws an exception when trying to active a Rundown when there is another Rundown in rehearsal', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToActivate: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })

      const testee: RundownTimelineService = createTestee({ rundownRepository })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      await expect(result).rejects.toThrow(AlreadyRehearsalException)
    })

    it('does not throw an AlreadyRehearsalException when trying to activate a Rundown that is in rehearsal', () => {
      const rundownToActivate: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })

      const basicRundowns: Rundown[] = [rundownToActivate]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)
      when(rundownRepository.getRundown(rundownToActivate.id)).thenResolve(rundownToActivate)


      const testee: RundownTimelineService = createTestee({ rundownRepository })

      const result: () => Promise<void> = () => testee.activateRundown(rundownToActivate.id)

      expect(result).not.toThrow(AlreadyRehearsalException)
    })

    it('does not emit infinitePiecesUpdatedEvent unless pieces are changed', async () => {
      const aRundownMock: Rundown = EntityMockFactory.createRundownMock({ id: 'aRundown', mode: RundownMode.INACTIVE })
      const firstLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'samePieceId' })
      const secondLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'samePieceId' })

      const firstMap: Map<string, Piece[]> = new Map<string, Piece[]>([['firstLayer', [firstLayerPiece]]])
      const secondMap: Map<string, Piece[]> = new Map<string, Piece[]>([['firstLayer', [secondLayerPiece]]])
      const aRundown: Rundown = instance(aRundownMock)
      when(aRundownMock.getInfinitePiecesMap()).thenReturn(firstMap).thenReturn(secondMap)

      const rundowns: Rundown[] = [aRundown]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(rundownRepository.getBasicRundowns()).thenResolve(rundowns)

      const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository,
        rundownEventEmitter,
      })

      await testee.activateRundown('aRundown')
      verify(rundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
    })

    it('emits infinitePiecesUpdatedEvent when pieces are changed', async () => {
      const aRundownMock: Rundown = EntityMockFactory.createRundownMock({ id: 'aRundown', mode: RundownMode.INACTIVE })
      const firstLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'firstLayerPiece' })
      const secondLayerPiece: Piece = EntityTestFactory.createPiece({ id: 'secondLayerPiece' })

      const firstMap: Map<string, Piece[]> = new Map<string, Piece[]>([['firstLayer', [firstLayerPiece]]])
      const secondMap: Map<string, Piece[]> = new Map<string, Piece[]>([['firstLayer', [secondLayerPiece]]])
      const aRundown: Rundown = instance(aRundownMock)
      when(aRundownMock.getInfinitePiecesMap()).thenReturn(firstMap).thenReturn(secondMap)

      const rundowns: Rundown[] = [aRundown]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(rundownRepository.getBasicRundowns()).thenResolve(rundowns)

      const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository,
        rundownEventEmitter,
      })

      await testee.activateRundown('aRundown')
      verify(rundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).once()
    })

    describe('Rundown is coming from inactive', () => {
      it('calls playoutService.makeDevicesReady with okToDestroyStuff true', async () => {
        const playoutService: PlayoutService = createMockOfPlayoutService()
        const rundownMock: Rundown = EntityMockFactory.createRundownMock()
        when(rundownMock.getMode()).thenReturn(RundownMode.INACTIVE)
        when(rundownMock.getInfinitePiecesMap()).thenReturn(new Map())

        const rundown: Rundown = instance(rundownMock)
        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))
        when(rundownRepository.getBasicRundowns()).thenReturn(Promise.resolve([]))

        const testee: RundownTimelineService = createTestee({ playoutService, rundownRepository })
        await testee.activateRundown(rundown.id)

        verify(playoutService.makeDevicesReady(true, rundown.id)).once()
      })
    })

    describe('Rundown is coming from rehearsal', () => {
      it('calls playoutService.makeDevicesReady with okToDestroyStuff false', async () => {
        const playoutService: PlayoutService = createMockOfPlayoutService()
        const rundown: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))
        when(rundownRepository.getBasicRundowns()).thenReturn(Promise.resolve([]))

        const testee: RundownTimelineService = createTestee({playoutService, rundownRepository})
        await testee.activateRundown(rundown.id)

        verify(playoutService.makeDevicesReady(false, rundown.id)).once()
      })
    })
  })

  describe(`${RundownTimelineService.prototype.enterRehearsal.name}`, () => {
    it('throws an exception when trying to enter rehearsal on a Rundown when another Rundown is already active', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.ACTIVE })]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToEnterRehearsal: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })
      const testee: RundownTimelineService = createTestee({ rundownRepository })

      const result: () => Promise<void> = () => testee.enterRehearsal(rundownToEnterRehearsal.id)

      await expect(result).rejects.toThrow(AlreadyActivatedException)
    })

    it('throws an exception when trying to enter rehearsal on a Rundown when another Rundown is already in rehearsal', async () => {
      const basicRundowns: Rundown[] = [EntityTestFactory.createRundown({ mode: RundownMode.REHEARSAL })]
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)

      const rundownToEnterRehearsal: Rundown = EntityMockFactory.createRundown({ id: 'inactiveRundown', mode: RundownMode.INACTIVE })

      const testee: RundownTimelineService = createTestee({ rundownRepository })

      const result: () => Promise<void> = () => testee.enterRehearsal(rundownToEnterRehearsal.id)

      await expect(result).rejects.toThrow(AlreadyRehearsalException)
    })

    it('calls playoutService.makeDevicesReady with okToDestroyStuff is true', async () => {
      const playoutService: PlayoutService = createMockOfPlayoutService()
      const rundownMock: Rundown = EntityMockFactory.createRundownMock()
      when(rundownMock.getInfinitePiecesMap()).thenReturn(new Map())

      const rundown: Rundown = instance(rundownMock)
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))
      when(rundownRepository.getBasicRundowns()).thenReturn(Promise.resolve([]))

      const testee: RundownTimelineService = createTestee({ playoutService, rundownRepository })
      await testee.enterRehearsal(rundown.id)

      verify(playoutService.makeDevicesReady(true, rundown.id)).once()
    })
  })

  describe(`${RundownTimelineService.prototype.deactivateRundown.name}`, () => {
    it('calls the playoutService.makeDevicesStandDown', async () => {
      const playoutService: PlayoutService = createMockOfPlayoutService()
      const rundown: Rundown = EntityMockFactory.createRundown()
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

      const testee: RundownTimelineService = createTestee({ playoutService, rundownRepository })
      await testee.deactivateRundown(rundown.id)

      verify(playoutService.makeDevicesStandDown()).once()
    })
  })

  describe(`${RundownTimelineService.prototype.setNextFromIds.name}`, () => {
    describe('has active segment with unplanned part as next', () => {
      it('removes unplayed unplanned part when next cursor is moved away', async () => {
        const activePart: Part = EntityTestFactory.createPart({ id: 'activePart' })
        const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
        const nextSegment: Segment = EntityTestFactory.createSegment({ parts: [nextPart] })
        const unplayedUnplannedPart: Part = EntityTestFactory.createPart({ id: 'unplannedNextPart', isNext: true, executedAt: 0, ingestedPart: undefined })
        const activeSegment: Segment = EntityTestFactory.createSegment({ parts: [activePart, unplayedUnplannedPart]})
        const segments: Segment[] = [activeSegment, nextSegment]
        const rundown: Rundown = EntityTestFactory.createRundown({
          segments: segments,
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              segment: activeSegment,
              part: activePart,
              owner: Owner.SYSTEM
            },
            nextCursor: {
              segment: activeSegment,
              part: unplayedUnplannedPart,
              owner: Owner.SYSTEM
            },
            infinitePieces: new Map()
          },
        })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        const testee: RundownTimelineService = createTestee({
          rundownRepository,
        })
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

        expect(rundown.getActiveSegment().getParts()).toContain(unplayedUnplannedPart)
        await testee.setNextFromIds(rundown.id, nextSegment.id, nextPart.id)
        expect(rundown.getActiveSegment().getParts()).not.toContain(unplayedUnplannedPart)
      })
    })

    it('keeps unplanned part if it has already been played', async () => {
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart' })
      const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart' })
      const nextSegment: Segment = EntityTestFactory.createSegment({ parts: [nextPart] })
      const playedUnplannedPart: Part = EntityTestFactory.createPart({ id: 'unplannedNextPart', isNext: true, executedAt: 100, ingestedPart: undefined })
      const activeSegment: Segment = EntityTestFactory.createSegment({ parts: [activePart, playedUnplannedPart]})
      const segments: Segment[] = [activeSegment, nextSegment]
      const rundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            segment: activeSegment,
            part: activePart,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            segment: activeSegment,
            part: playedUnplannedPart,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map()
        },
      })

      const rundownRepository: RundownRepository = mock<RundownRepository>()
      const testee: RundownTimelineService = createTestee({
        rundownRepository,
      })
      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      expect(rundown.getActiveSegment().getParts()).toContain(playedUnplannedPart)
      await testee.setNextFromIds(rundown.id, nextSegment.id, nextPart.id)
      expect(rundown.getActiveSegment().getParts()).toContain(playedUnplannedPart)
    })
  })

  describe(`${RundownTimelineService.prototype.takeNext.name}`, () => {
    const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
    const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
    const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', pieces: [activePiece] })
    const activeSegment: Segment = EntityTestFactory.createSegment({ parts: [activePart], definesShowStyleVariant: false })
    const nextSegment: Segment = EntityTestFactory.createSegment({ parts: [nextPart], definesShowStyleVariant: false })
    const nextShowStyleVariantSegment: Segment = EntityTestFactory.createSegment( { parts: [nextPart], definesShowStyleVariant: true })

    const rundownRepository: RundownRepository = mock<RundownRepository>()
    const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
    const mockTimeLineObject: TimelineObject = mock<TimelineObject>()
    const mockTimeLineObjects: TimelineObject[] = [mockTimeLineObject]
    const mockTimelineObjectGroup: TimelineObjectGroup = mock<TimelineObjectGroup>({isGroup: true, children:mockTimeLineObjects})
    const mockTimeline: Timeline = mock<Timeline>({
      mockTimelineObjectGroup: instance(mockTimelineObjectGroup)
    })
    const timelineBuilder: TimelineBuilder = mock<TimelineBuilder>()
    const ingestService: IngestService = createMockOfIngestService()

    it('does not emit infinitePiecesUpdatedEvent unless pieces are changed', async () => {
      const segments: Segment[] = [activeSegment, nextSegment]
      const rundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            segment: activeSegment,
            part: activePart,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            segment: nextSegment,
            part: nextPart,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map()
        },
      })

      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      when(timelineBuilder.buildTimeline(rundown)).thenResolve(mockTimeline)

      const testee: RundownTimelineService = createTestee({
        rundownEventEmitter,
        rundownRepository,
        timelineBuilder,
      })

      await testee.takeNext(rundown.id)
      verify(rundownEventEmitter.emitInfinitePiecesUpdatedEvent(rundown)).never()
    })

    it('calls for reingest of rundown data if segment put on air defines a show style variant', async () => {
      const segments: Segment[] = [activeSegment, nextShowStyleVariantSegment]
      const rundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            segment: activeSegment,
            part: activePart,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            segment: nextShowStyleVariantSegment,
            part: nextPart,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map()
        },
      })

      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      when(timelineBuilder.buildTimeline(rundown)).thenResolve(mockTimeline)

      const testee: RundownTimelineService = createTestee( {
        rundownEventEmitter,
        rundownRepository,
        timelineBuilder,
        ingestService
      })

      await testee.takeNext(rundown.id)

      verify(ingestService.reloadIngestData(rundown.id)).once()
    })

    it('does not call for reingest of rundown data if segment put on air has not defined a show style variant', async () => {
      const segments: Segment[] = [activeSegment, nextSegment]
      const rundown: Rundown = EntityTestFactory.createRundown({
        segments: segments,
        mode: RundownMode.ACTIVE,
        alreadyActiveProperties: {
          activeCursor: {
            segment: activeSegment,
            part: activePart,
            owner: Owner.SYSTEM
          },
          nextCursor: {
            segment: nextSegment,
            part: nextPart,
            owner: Owner.SYSTEM
          },
          infinitePieces: new Map()
        },
      })

      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      when(timelineBuilder.buildTimeline(rundown)).thenResolve(mockTimeline)

      const testee: RundownTimelineService = createTestee( {
        rundownEventEmitter,
        rundownRepository,
        timelineBuilder,
        ingestService
      })

      await testee.takeNext(rundown.id)

      verify(ingestService.reloadIngestData(rundown.id)).never()
    })

    describe('no Part has been Taken yet', () => {
      it('does a Take', async () => {
        const rundownMock: Rundown = mock(Rundown)
        when(rundownMock.getActivePart()).thenThrow(new UnsupportedOperationException(''))
        const rundown: Rundown = instance(rundownMock)

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const testee: RundownTimelineService = createTestee({rundownRepository})

        try {
          await testee.takeNext(rundown.id)
        } catch {
          // We need to catch the error, else we will never reach the verify below
        }

        verify(rundownMock.takeNext()).once()
      })
    })

    describe('active Part has an inTransition', () => {
      describe('enough time has not yet passed for the block duration', () => {
        it('does not stop the callbackScheduler', async () => {
          const now: number = Date.now()
          jest.useFakeTimers({ now })

          const blockTakeDuration: number = 100

          const onAirInTransition: InTransition = {
            blockTakeDuration,
            delayPiecesDuration: 0,
            keepPreviousPartAliveDuration: 0
          }
          const onAirPart: Part = EntityTestFactory.createPart({
            id: 'onAirPart',
            executedAt: now - blockTakeDuration / 2,
            inTransition: onAirInTransition
          })
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          when(rundownMock.getActivePart()).thenReturn(onAirPart)
          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const callbackScheduler: CallbackScheduler = mock<CallbackScheduler>()

          const testee: RundownTimelineService = createTestee({ rundownRepository, callbackScheduler })

          try {
            await testee.takeNext(rundown.id)
          } catch {
            // expected error - ignore
          }

          verify(callbackScheduler.stop()).never()
        })

        it('does not do a Take', async () => {
          const now: number = Date.now()
          jest.useFakeTimers({ now })

          const blockTakeDuration: number = 100

          const onAirInTransition: InTransition = {
            blockTakeDuration,
            delayPiecesDuration: 0,
            keepPreviousPartAliveDuration: 0
          }
          const onAirPart: Part = EntityTestFactory.createPart({
            id: 'onAirPart',
            executedAt: now - blockTakeDuration / 2,
            inTransition: onAirInTransition
          })
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          when(rundownMock.getActivePart()).thenReturn(onAirPart)
          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const testee: RundownTimelineService = createTestee({ rundownRepository })

          try {
            await testee.takeNext(rundown.id)
          } catch {
            // expected error - ignore
          }

          verify(rundownMock.takeNext()).never()
        })

        it('throws a TakeIsBlockedException', async () => {
          const now: number = Date.now()
          jest.useFakeTimers({ now })

          const blockTakeDuration: number = 100

          const onAirInTransition: InTransition = {
            blockTakeDuration,
            delayPiecesDuration: 0,
            keepPreviousPartAliveDuration: 0
          }
          const onAirPart: Part = EntityTestFactory.createPart({
            id: 'onAirPart',
            executedAt: now - blockTakeDuration / 2,
            inTransition: onAirInTransition
          })
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          when(rundownMock.getActivePart()).thenReturn(onAirPart)
          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const testee: RundownTimelineService = createTestee({ rundownRepository })

          await expect(() => testee.takeNext(rundown.id)).rejects.toThrow(TakeIsBlockedException)
        })
      })

      describe('enough time has passed for the block duration', () => {
        it('stops the callbackScheduler', async () => {
          const now: number = Date.now()
          jest.useFakeTimers({ now })

          const blockTakeDuration: number = 100

          const onAirInTransition: InTransition = {
            blockTakeDuration,
            delayPiecesDuration: 0,
            keepPreviousPartAliveDuration: 0
          }
          const onAirPart: Part = EntityTestFactory.createPart({
            id: 'onAirPart',
            executedAt: now - blockTakeDuration * 2,
            inTransition: onAirInTransition
          })
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          when(rundownMock.getActivePart()).thenReturn(onAirPart)
          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const callbackScheduler: CallbackScheduler = mock<CallbackScheduler>()

          const testee: RundownTimelineService = createTestee({ rundownRepository, callbackScheduler })

          await testee.takeNext(rundown.id)

          verify(callbackScheduler.stop()).once()
        })

        it('does a Take', async () => {
          const now: number = Date.now()
          jest.useFakeTimers({ now })

          const blockTakeDuration: number = 100

          const onAirInTransition: InTransition = {
            blockTakeDuration,
            delayPiecesDuration: 0,
            keepPreviousPartAliveDuration: 0
          }
          const onAirPart: Part = EntityTestFactory.createPart({
            id: 'onAirPart',
            executedAt: now - blockTakeDuration * 2,
            inTransition: onAirInTransition
          })
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          when(rundownMock.getActivePart()).thenReturn(onAirPart)
          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const testee: RundownTimelineService = createTestee({ rundownRepository })

          await testee.takeNext(rundown.id)

          verify(rundownMock.takeNext()).once()
        })
      })
    })

    describe('when a take mode is selected', () => {
      const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
      const activeSegment: Segment = EntityTestFactory.createSegment({parts: [activePart]})
      const activePartInfinitePiecesMap: Map<string, Piece[]> = new Map<string, Piece[]>([['activeLayerId', [activePiece]]])
      const previousPiece: Piece = EntityTestFactory.createPiece({id: 'previousPieceId'})
      const previousPart: Part = EntityTestFactory.createPart({ id: 'previousPart', pieces: [previousPiece] })
      const rundownMock: Rundown = EntityMockFactory.createActiveRundownMock({
        activePart: activePart,
        nextPart: nextPart,
        previousPart: previousPart,
        activeSegment: activeSegment,
        infinitePiecesMap: activePartInfinitePiecesMap,
      })

      describe('and the take mode is Standard', () => {
        it('should not emit partInsertedAsNext event', async () => {
          const activeRundown: Rundown = instance(rundownMock)
          const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
          const rundownRepository: RundownRepository = mock<RundownRepository>()

          when(rundownMock.getTakeMode()).thenReturn(TakeMode.STANDARD)
          when(rundownRepository.getRundown(activeRundown.id)).thenReturn(Promise.resolve(activeRundown))

          const testee: RundownTimelineService = createTestee({rundownRepository, rundownEventEmitter})
          await testee.takeNext(activeRundown.id)
          verify(rundownEventEmitter.emitPartInsertedAsNextEvent(activeRundown, anything())).never()
        })
      })

      describe('and the take mode is Recall', () => {
        it('should emit partInsertedAsNext event', async () => {
          const activeRundown: Rundown = instance(rundownMock)
          const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
          const rundownRepository: RundownRepository = mock<RundownRepository>()

          when(rundownMock.getTakeMode()).thenReturn(TakeMode.RECALL)
          when(rundownRepository.getRundown(activeRundown.id)).thenReturn(Promise.resolve(activeRundown))

          const testee: RundownTimelineService = createTestee({rundownRepository, rundownEventEmitter})
          await testee.takeNext(activeRundown.id)
          verify(rundownEventEmitter.emitPartInsertedAsNextEvent(activeRundown, anything())).once()
        })
      })
    })
  })

  describe(`${RundownTimelineService.prototype.insertPartAsOnAir.name}`, () => {
    it('does not emit infinitePiecesUpdatedEvent unless pieces are changed', async () => {
      const aPiece: Piece = EntityTestFactory.createPiece({id: 'aPieceId'})
      const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
      const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
      const activeSegment: Segment = EntityTestFactory.createSegment({parts: [activePart]})
      const activePartInfinitePiecesMap: Map<string, Piece[]> = new Map<string, Piece[]>([['activeLayerId', [activePiece]]])
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
      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(aRundown.id)).thenResolve(aRundown)
      when(rundownRepository.getBasicRundowns()).thenResolve(basicRundowns)
      const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({
        rundownRepository,
        rundownEventEmitter,
      })

      await testee.insertPieceAsOnAir(aRundown.id, aPiece)

      verify(rundownEventEmitter.emitInfinitePiecesUpdatedEvent(aRundown)).never()
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

      const testee: RundownTimelineService = createTestee({ rundownRepository })

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

        const testee: RundownTimelineService = createTestee({ rundownRepository })

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

        const testee: RundownTimelineService = createTestee({ rundownRepository })

        expect(rundown.getNextPart().id).toBe(nextPart.id)

        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        expect(rundown.getNextPart().id).toBe(nextPart.id)
      })
    })

    describe('the Next Part is not immediately after the OnAir part', () => {
      it('keeps the Part marked as Next as the Next Part', async () => {
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })

        const segmentId: string = 'segmentId'
        const onAirPart: Part = EntityTestFactory.createPart({ id: 'onAirPart', segmentId })
        const partBetweenOnAirAndNextPart: Part = EntityTestFactory.createPart({ id: 'middlePart', segmentId })
        const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', segmentId })

        const segment: Segment = EntityTestFactory.createSegment({ id: segmentId, parts: [onAirPart, partBetweenOnAirAndNextPart, nextPart] })

        const rundown: Rundown = EntityTestFactory.createRundown({
          segments: [segment]
        })
        rundown.activate()
        rundown.takeNext()
        rundown.setNextFromIds(segment.id, nextPart.id)

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const testee: RundownTimelineService = createTestee({ rundownRepository })

        expect(rundown.getNextPart().id).toBe(nextPart.id)

        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        expect(rundown.getNextPart().id).toBe(nextPart.id)
      })
    })

    describe('no Parts were pruned from the active Segment', () => {
      it('emits a PartInsertedAsOnAirEvent with the inserted Part', async () => {
        const rundownMock: Rundown = EntityMockFactory.createRundownMock()
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })
        when(rundownMock.getActivePart()).thenReturn(partToBeInserted)
        when(rundownMock.pruneOldUnplannedPartsOnActiveSegment()).thenReturn([])

        const rundown: Rundown = instance(rundownMock)

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownService = createTestee({ rundownRepository, rundownEventEmitter })
        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        verify(rundownEventEmitter.emitPartInsertedAsOnAirEvent(rundown, partToBeInserted)).once()
      })

      describe('the active Part of the Rundown is not the same as the Part inserted', () => {
        it('does not emit a PartInsertedAsOnAirEvent', async () => {
          const rundownMock: Rundown = EntityMockFactory.createRundownMock()
          const partOnAir: Part = EntityTestFactory.createPart({ id: 'partThatWasntInserted' })
          when(rundownMock.getActivePart()).thenReturn(partOnAir)
          when(rundownMock.pruneOldUnplannedPartsOnActiveSegment()).thenReturn([])
          const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })

          const rundown: Rundown = instance(rundownMock)

          const rundownRepository: RundownRepository = mock<RundownRepository>()
          when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

          const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

          const testee: RundownService = createTestee({ rundownRepository, rundownEventEmitter })
          await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

          verify(rundownEventEmitter.emitPartInsertedAsOnAirEvent(anything(), anything())).never()
        })
      })
    })

    describe('Parts were pruned on the active Segment', () => {
      it('does not emit a PartInsertedAsOnAirEvent', async () => {
        const rundownMock: Rundown = EntityMockFactory.createRundownMock()
        when(rundownMock.pruneOldUnplannedPartsOnActiveSegment()).thenReturn(['somePrunedPartIdOne', 'somePrunedPartIdTwo'])
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })
        when(rundownMock.getActivePart()).thenReturn(partToBeInserted)

        const rundown: Rundown = instance(rundownMock)

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownService = createTestee({ rundownRepository, rundownEventEmitter })
        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        verify(rundownEventEmitter.emitPartInsertedAsOnAirEvent(anything(), anything())).never()
      })

      it('emits a SegmentUpdatedEvent for the active Segment', async () => {
        const segment: Segment = EntityTestFactory.createSegment()
        const rundownMock: Rundown = EntityMockFactory.createRundownMock()
        when(rundownMock.getActiveSegment()).thenReturn(segment)
        when(rundownMock.pruneOldUnplannedPartsOnActiveSegment()).thenReturn(['somePrunedPartIdOne', 'somePrunedPartIdTwo'])
        const partToBeInserted: Part = EntityTestFactory.createPart({ id: 'partToBeInserted', ingestedPart: undefined })
        when(rundownMock.getActivePart()).thenReturn(partToBeInserted)

        const rundown: Rundown = instance(rundownMock)

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenReturn(Promise.resolve(rundown))

        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownService = createTestee({ rundownRepository, rundownEventEmitter })
        await testee.insertPartAsOnAir(rundown.id, partToBeInserted)

        verify(rundownEventEmitter.emitSegmentUpdated(rundown, segment)).once()
      })
    })
  })

  describe(RundownTimelineService.prototype.stopPiece.name, () => {
    describe('there is no Piece to stop for the PieceId', () => {
      const nonExistingPieceId: string = 'nonExistingPieceId'
      let rundown: Rundown
      let rundownRepository: RundownRepository

      beforeEach(() => {
        const onAirPart: Part = EntityTestFactory.createPart({ isOnAir: true })
        const onAirSegment: Segment = EntityTestFactory.createSegment({ isOnAir: true })
        rundown = EntityTestFactory.createRundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part: onAirPart,
              segment: onAirSegment,
              owner: Owner.SYSTEM,
            },
            nextCursor: undefined,
            infinitePieces: new Map(),
          }
        })

        rundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      })

      it('saves no new Timeline', async () => {
        const timelineRepository: TimelineRepository = mock<TimelineRepository>()

        const testee: RundownTimelineService = createTestee({ rundownRepository, timelineRepository })
        await testee.stopPiece(rundown.id, nonExistingPieceId)

        verify(timelineRepository.saveTimeline(anything())).never()
      })

      it('emits no PieceStoppedEvent', async () => {
        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownTimelineService = createTestee({ rundownRepository, rundownEventEmitter })
        await testee.stopPiece(rundown.id, nonExistingPieceId)

        verify(rundownEventEmitter.emitPieceStoppedEvent(anything(), anyString(), anything())).never()
      })

      it('does not save the Rundown', async () => {
        const testee: RundownTimelineService = createTestee({ rundownRepository })
        await testee.stopPiece(rundown.id, nonExistingPieceId)

        verify(rundownRepository.saveRundown(rundown)).never()
      })
    })

    describe('there is a Piece to stop for the PieceId', () => {
      let piece: Piece
      let part: Part
      let segment: Segment
      let rundown: Rundown
      let rundownRepository: RundownRepository

      beforeEach(() => {
        piece = EntityTestFactory.createPiece()
        part = EntityTestFactory.createPart({ isOnAir: true, pieces: [piece] })
        segment = EntityTestFactory.createSegment({ isOnAir: true, parts: [part] })
        rundown = EntityTestFactory.createRundown({
          mode: RundownMode.ACTIVE,
          alreadyActiveProperties: {
            activeCursor: {
              part,
              segment,
              owner: Owner.SYSTEM,
            },
            nextCursor: undefined,
            infinitePieces: new Map()
          }
        })

        rundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)
      })

      it('build and saves a new Timeline', async () => {
        const timeline: Timeline = { // We just need a Timeline. We don't care what's in for this test.
          timelineGroups: []
        }

        const timelineBuilder: TimelineBuilder = mock<TimelineBuilder>()
        when(timelineBuilder.buildTimeline(rundown)).thenResolve(timeline)

        const timelineRepository: TimelineRepository = mock<TimelineRepository>()

        const testee: RundownTimelineService = createTestee({ rundownRepository, timelineBuilder, timelineRepository })
        await testee.stopPiece(rundown.id, piece.id)

        verify(timelineBuilder.buildTimeline(rundown)).once()
        verify(timelineRepository.saveTimeline(timeline)).once()
      })

      it('emits a PieceStopped event for the Piece', async () => {
        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownTimelineService = createTestee({ rundownRepository, rundownEventEmitter })
        await testee.stopPiece(rundown.id, piece.id)

        verify(rundownEventEmitter.emitPieceStoppedEvent(rundown, anyString(), piece)).once()
      })

      it('saves the Rundown', async () => {
        const testee: RundownTimelineService = createTestee({ rundownRepository })
        await testee.stopPiece(rundown.id, piece.id)

        verify(rundownRepository.saveRundown(rundown)).once()
      })
    })
  })

  describe(RundownTimelineService.prototype.resetRundown.name, () => {
    describe('when rundown is in rehearsal', () => {
      it('is still in rehearsal after reset', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-id',
          segments: [EntityTestFactory.createSegment({
            parts: [EntityTestFactory.createPart()]
          })],
        })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

        const testee: RundownTimelineService = createTestee({ rundownRepository })
        rundown.enterRehearsal()
        expect(rundown.isRehearsal()).toBeTruthy()

        await testee.resetRundown(rundown.id)

        expect(rundown.isRehearsal()).toBeTruthy()
      })
    })

    describe('when rundown is active', () => {
      it('is still active after reset', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-id',
          segments: [EntityTestFactory.createSegment({
            parts: [EntityTestFactory.createPart()]
          })],
        })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

        const testee: RundownTimelineService = createTestee({ rundownRepository })
        rundown.activate()
        expect(rundown.isActive()).toBeTruthy()

        await testee.resetRundown(rundown.id)

        expect(rundown.isActive()).toBeTruthy()
      })
    })

    it('emits set next event after reset event', async () => {
      const rundown: Rundown = EntityTestFactory.createRundown({
        id: 'rundown-id',
        segments: [EntityTestFactory.createSegment({
          parts: [EntityTestFactory.createPart()]
        })],
      })

      const rundownRepository: RundownRepository = mock<RundownRepository>()
      when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

      const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

      const testee: RundownTimelineService = createTestee({ rundownRepository, rundownEventEmitter })
      rundown.activate()

      await testee.resetRundown(rundown.id)

      verify(rundownEventEmitter.emitSetNextEvent(rundown)).calledAfter(rundownEventEmitter.emitResetEvent(rundown))
    })
  })

  describe(`${RundownTimelineService.prototype.setTakeMode.name}`, () => {
    describe('when take mode has been changed in a rundown', () => {
      it('will emit a rundown updated event', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-id',
          segments: [EntityTestFactory.createSegment({
            parts: [EntityTestFactory.createPart()]
          })],
        })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownTimelineService = createTestee({rundownRepository, rundownEventEmitter})

        await testee.setTakeMode(rundown.id, TakeMode.RECALL)

        verify(rundownEventEmitter.emitRundownUpdated(rundown)).once()
      })
    })

    describe('when take mode is set to the same take mode in a rundown', () => {
      it('won\'t emit a rundown updated event since no changes occurred', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-id',
          segments: [EntityTestFactory.createSegment({
            parts: [EntityTestFactory.createPart()]
          })],
        })

        const rundownRepository: RundownRepository = mock<RundownRepository>()
        when(rundownRepository.getRundown(rundown.id)).thenResolve(rundown)

        const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()

        const testee: RundownTimelineService = createTestee({rundownRepository, rundownEventEmitter})

        await testee.setTakeMode(rundown.id, TakeMode.STANDARD)

        verify(rundownEventEmitter.emitRundownUpdated(rundown)).never()
      })
    })
  })
})

function createTestee(params?: {
  rundownEventEmitter?: RundownEventEmitter
  ingestedRundownRepository?: IngestedRundownRepository
  rundownRepository?: RundownRepository
  timelineRepository?: TimelineRepository
  timelineBuilder?: TimelineBuilder
  ingestService?: IngestService,
  playoutService?: PlayoutService,
  callbackScheduler?: CallbackScheduler
  blueprint?: Blueprint,
  playoutContentService?: PlayoutContentUpdateService,
  logger?: Logger
}): RundownTimelineService {
  const timelineBuilderMock: TimelineBuilder = mock<TimelineBuilder>()
  when(timelineBuilderMock.buildTimeline(anything())).thenReturn(Promise.resolve({ timelineGroups: [] }))

  return new RundownTimelineService(
    instance(params?.rundownEventEmitter ?? mock<RundownEventEmitter>()),
    instance(params?.ingestedRundownRepository ?? mock<IngestedRundownRepository>()),
    instance(params?.rundownRepository ?? mock<RundownRepository>()),
    instance(params?.timelineRepository ?? mock<TimelineRepository>()),
    instance(params?.timelineBuilder ?? timelineBuilderMock),
    instance(params?.ingestService ?? createMockOfIngestService()),
    instance(params?.playoutService ?? createMockOfPlayoutService()) ,
    instance(params?.callbackScheduler ?? mock<CallbackScheduler>()),
    instance(params?.blueprint ?? mock<Blueprint>()),
    instance(params?.playoutContentService ?? mock<PlayoutContentUpdateService>()),
    instance(params?.logger ?? createMockOfLogger()),
  )
}

function createMockOfIngestService(): IngestService {
  const mockedIngestService: IngestService = mock()
  when(mockedIngestService.reloadIngestData(anyString())).thenResolve()
  return mockedIngestService
}

function createMockOfPlayoutService(): PlayoutService {
  const mockedPlayoutService: PlayoutService = mock()
  when(mockedPlayoutService.makeDevicesReady(anything(), anyString())).thenResolve()
  when(mockedPlayoutService.makeDevicesStandDown()).thenResolve()
  return mockedPlayoutService
}

function createMockOfLogger(): Logger {
  const mockedLogger: Logger = mock<Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => createMockOfLogger())
  when(mockedLogger.data(anything())).thenCall(() => createMockOfLogger())
  when(mockedLogger.metadata(anything())).thenCall(() => createMockOfLogger())
  return mockedLogger
}
