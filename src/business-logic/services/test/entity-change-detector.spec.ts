import { EntityChangeDetector } from '../entity-change-detector'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Rundown, RundownInterface } from '../../../model/entities/rundown'
import { IngestedRundown } from '../../../model/entities/ingested-rundown'
import { RundownTimingType } from '../../../model/enums/rundown-timing-type'
import { Segment, SegmentInterface } from '../../../model/entities/segment'
import { IngestedSegment } from '../../../model/entities/ingested-segment'
import { Part } from '../../../model/entities/part'
import { IngestedPart } from '../../../model/entities/ingested-part'
import { IngestedPiece } from '../../../model/entities/ingested-piece'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { TransitionType } from '../../../model/enums/transition-type'
import { DeviceType } from '../../../model/enums/device-type'
import { PieceType } from '../../../model/enums/piece-type'
import { PlayoutContentType } from '../../../model/enums/playout-content-type'

describe(EntityChangeDetector.name, () => {
  describe(EntityChangeDetector.prototype.doesShallowRundownDifferFromIngestedRundown.name, () => {
    describe('when nothing has changed', () => {
      it('returns false', () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', name: 'rundown-a', modifiedAt: 0 })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', name: 'rundown-a', modifiedAt: 0 })

        const testee: EntityChangeDetector = createTestee()

        expect(testee.doesShallowRundownDifferFromIngestedRundown(rundown, ingestedRundown)).toBeFalsy()
      })
    })

    const testCases: [string, Partial<RundownInterface>, Partial<IngestedRundown>][] = [
      ['name', { name: 'rundown-a' }, { name: 'rundown-a (updated)' }],
      ['rank', { showStyleVariantId: 'variant-a' }, { showStyleVariantId: 'variant-b' }],
      ['modification timestamp', { modifiedAt: 100 }, { modifiedAt: 200 }],
      ['timing', { timing: { type: RundownTimingType.UNSCHEDULED } }, { timings: { type: RundownTimingType.BACKWARD, expectedEndEpochTime: Date.now() } }],
      ['baseline', { baselineTimelineObjects: [{ id: '', layer: 'layer-1', enable: { start: 0 }, content: { deviceType: DeviceType.CASPAR_CG, type: undefined }}] }, { baselineTimelineObjects: [{ id: '', layer: 'layer-1', enable: { start: 0 }, content: {  deviceType: DeviceType.ATEM, type: undefined  }}] }],
    ]
    testCases.forEach(([attribute, rundownAttributes, ingestedRundownAttributes]) => {
      describe(`when the ingested rundown has a different ${attribute} than the rundown`, () => {
        it('returns true', () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', name: 'rundown-a', ...rundownAttributes })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', name: 'rundown-a', ...ingestedRundownAttributes })

          const testee: EntityChangeDetector = createTestee()

          expect(testee.doesShallowRundownDifferFromIngestedRundown(rundown, ingestedRundown)).toBeTruthy()
        })
      })
    })
  })

  describe(EntityChangeDetector.prototype.doesShallowSegmentDifferFromIngestSegment.name, () => {
    describe('when nothing has changed', () => {
      it('returns false', () => {
        const segment: Segment = EntityTestFactory.createSegment({ id: 'segment-a', name: 'segment-a' })
        const ingestedSegment: IngestedSegment = EntityTestFactory.createIngestedSegment({ id: 'segment-a', name: 'segment-a' })

        const testee: EntityChangeDetector = createTestee()

        expect(testee.doesShallowSegmentDifferFromIngestSegment(segment, ingestedSegment)).toBeFalsy()
      })
    })

    const testCases: [string, Partial<SegmentInterface>, Partial<IngestedSegment>][] = [
      ['name', { name: 'segment-a' }, { name: 'segment-a (updated)' }],
      ['rank', { rank: 0 }, { rank: 5 }],
      ['visibility', { isHidden: true }, { isHidden: false }],
      ['reference tag', { name: 'segment-a' }, { referenceTag: '125' }],
      ['metadata', { metadata: { foo: 'bar' } }, { metadata: undefined }],
      ['expected duration', { expectedDurationInMs: 1000 }, { budgetDuration: 2000 }],
      ['invalidity', { expectedDurationInMs: 1000, invalidity: { reason: 'reason' } }, { budgetDuration: 2000 }],
      ['value for defineShowStyleVariant', { definesShowStyleVariant: false }, { definesShowStyleVariant: true }],
    ]
    testCases.forEach(([attribute, segmentAttributes, ingestedSegmentAttributes]) => {
      describe(`when the ingested segment has a different ${attribute} than the segment`, () => {
        it('returns true', () => {
          const segment: Segment = EntityTestFactory.createSegment({ id: 'segment-a', name: 'segment-a', ...segmentAttributes })
          const ingestedSegment: IngestedSegment = EntityTestFactory.createIngestedSegment({ id: 'segment-a', name: 'segment-a', ...ingestedSegmentAttributes })

          const testee: EntityChangeDetector = createTestee()

          expect(testee.doesShallowSegmentDifferFromIngestSegment(segment, ingestedSegment)).toBeTruthy()
        })
      })
    })
  })

  describe(EntityChangeDetector.prototype.doesIngestedPartOnPartDifferFromIngestedPart.name, () => {
    describe('when nothing has changed', () => {
      it('returns false', () => {
        const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'part-a' })
        const part: Part = EntityTestFactory.createPart({ id: 'part-a', name: 'part-a', ingestedPart })

        const testee: EntityChangeDetector = createTestee()

        expect(testee.doesIngestedPartOnPartDifferFromIngestedPart(part, ingestedPart)).toBeFalsy()
      })
    })

    const testCases: [string, Partial<IngestedPart>, Partial<IngestedPart>][] = [
      ['name', { name: 'part-a' }, { name: 'part-a (updated)' }],
      ['rank', { rank: 100 }, { rank: 200 }],
      ['expected duration', { expectedDuration: 100 }, { expectedDuration: 200 }],
      ['invalidity', { invalidity: { reason: 'reason' } }, { invalidity: { reason: 'reason-2' } }],
      ['in transition', { inTransition: { delayPiecesDuration: 0, blockTakeDuration: 0, keepPreviousPartAliveDuration: 0 } }, { inTransition: { delayPiecesDuration: 0, blockTakeDuration: 0, keepPreviousPartAliveDuration: 100 } }],
      ['out transition', { outTransition: { keepAliveDuration: 100 } }, { outTransition: { keepAliveDuration: 200 } }],
      ['auto next', { autoNext: { overlap: 100 } }, { autoNext: { overlap: 200 } }],
      ['pieces', { ingestedPieces: [EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'hello' })] }, { ingestedPieces: [EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'world' })] }],
    ]
    testCases.forEach(([attribute, currentIngestedPartAttributes, ingestedPartAttributes]) => {
      describe(`when the ingested part has a different ${attribute} than the parts ingested part`, () => {
        it('returns true', () => {
          const part: Part = EntityTestFactory.createPart({ id: 'part-a', name: 'part-a', ingestedPart: EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'part-a', ...currentIngestedPartAttributes }) })
          const ingestedPart: IngestedPart = EntityTestFactory.createIngestedPart({ id: 'part-a', name: 'part-a', ...ingestedPartAttributes })

          const testee: EntityChangeDetector = createTestee()

          expect(testee.doesIngestedPartOnPartDifferFromIngestedPart(part, ingestedPart)).toBeTruthy()
        })
      })
    })
  })

  describe(EntityChangeDetector.prototype.doesIngestedPiecesDiffer.name, () => {
    describe('when nothing has changed', () => {
      it('returns false', () => {
        const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'piece-a' })
        const newIngestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'piece-a' })

        const testee: EntityChangeDetector = createTestee()

        expect(testee.doesIngestedPiecesDiffer(ingestedPiece, newIngestedPiece)).toBeFalsy()
      })
    })

    const testCases: [string, Partial<IngestedPiece>, Partial<IngestedPiece>][] = [
      ['name', { name: 'piece-a' }, { name: 'piece-a (updated)' }],
      ['layer', { layer: 'layer-1' }, { layer: 'layer-2' }],
      ['lifespan', { pieceLifespan: PieceLifespan.WITHIN_PART }, { pieceLifespan: PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN }],
      ['start', { start: 0 }, { start: 100 }],
      ['duration', { duration: 0 }, { duration: 100 }],
      ['pre-roll duration', { preRollDuration: 0 }, { preRollDuration: 100 }],
      ['post-roll duration', { postRollDuration: 0 }, { postRollDuration: 100 }],
      ['transition type', { transitionType: TransitionType.NO_TRANSITION }, { transitionType: TransitionType.IN_TRANSITION }],
      ['timeline objects', { timelineObjects: [{ id: '', layer: 'layer-x', enable: { start: 0 }, content: {  deviceType: DeviceType.CASPAR_CG, type: undefined  } }] }, {  timelineObjects: [{ id: '', layer: 'layer-x', enable: { start: 0 }, content: {  deviceType: DeviceType.ATEM, type: undefined  } }]  }],
      ['metadata', { metadata: undefined }, { metadata: { type: PieceType.UNKNOWN, playoutContent: { type: PlayoutContentType.UNKNOWN } } }],
      ['content', { content: undefined }, { content: { foo: 'bar' } }],
    ]
    testCases.forEach(([attribute, pieceAttributes, ingestedPieceAttributes]) => {
      describe(`when the ingested piece has a different ${attribute} than the original ingested piece`, () => {
        it('returns true', () => {
          const ingestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'piece-a', ...pieceAttributes })
          const updatedIngestedPiece: IngestedPiece = EntityTestFactory.createIngestedPiece({ id: 'piece-a', name: 'piece-a', ...ingestedPieceAttributes })

          const testee: EntityChangeDetector = createTestee()

          expect(testee.doesIngestedPiecesDiffer(ingestedPiece, updatedIngestedPiece)).toBeTruthy()
        })
      })
    })
  })
})

function createTestee(): EntityChangeDetector {
  return new EntityChangeDetector()
}
