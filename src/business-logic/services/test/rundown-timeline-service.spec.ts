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
import { IngestService } from '../interfaces/ingest-service'
import { RundownService } from '../interfaces/rundown-service'

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
  })

  describe(`${RundownTimelineService.prototype.takeNext.name}`, () => {
    const activePiece: Piece = EntityTestFactory.createPiece({ id: 'activePiece' })
    const activePart: Part = EntityTestFactory.createPart({ id: 'activePart', pieces: [activePiece] })
    const nextPart: Part = EntityTestFactory.createPart({ id: 'nextPart', pieces: [activePiece] })
    const activeSegment: Segment = EntityTestFactory.createSegment({parts: [activePart], definesShowStyleVariant: false})
    const nextSegment: Segment = EntityTestFactory.createSegment({parts: [nextPart], definesShowStyleVariant: false})
    const nextShowStyleVariantSegment: Segment = EntityTestFactory.createSegment( { parts: [nextPart], definesShowStyleVariant: true})

    const rundownRepository: RundownRepository = mock<RundownRepository>()
    const rundownEventEmitter: RundownEventEmitter = mock<RundownEventEmitter>()
    const mockTimeLineObject: TimelineObject = mock<TimelineObject>()
    const mockTimeLineObjects: TimelineObject[] = [mockTimeLineObject]
    const mockTimelineObjectGroup: TimelineObjectGroup = mock<TimelineObjectGroup>({isGroup: true, children:mockTimeLineObjects})
    const mockTimeline: Timeline = mock<Timeline>({
      mockTimelineObjectGroup: instance(mockTimelineObjectGroup)
    })
    const timelineBuilder: TimelineBuilder = mock<TimelineBuilder>()
    const ingestService: IngestService = mock<IngestService>()

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
  ingestService?: IngestService
  callbackScheduler?: CallbackScheduler
  blueprint?: Blueprint
}): RundownTimelineService {
  return new RundownTimelineService(
    instance(params?.rundownEventEmitter ?? mock<RundownEventEmitter>()),
    instance(params?.ingestedRundownRepository ?? mock<IngestedRundownRepository>()),
    instance(params?.rundownRepository ?? mock<RundownRepository>()),
    instance(params?.segmentRepository ?? mock<SegmentRepository>()),
    instance(params?.partRepository ?? mock<PartRepository>()),
    instance(params?.pieceRepository ?? mock<PieceRepository>()),
    instance(params?.timelineRepository ?? mock<TimelineRepository>()),
    instance(params?.timelineBuilder ?? mock<TimelineBuilder>()),
    instance(params?.ingestService ?? mock<IngestService>()),
    instance(params?.callbackScheduler ?? mock<CallbackScheduler>()),
    instance(params?.blueprint ?? mock<Blueprint>())
  )
}
