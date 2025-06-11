import { IngestRundownSynchronizer, RundownSynchronizeResult } from './ingest-rundown-synchronizer'
import { IngestedEntityToEntityMapper } from '../domain/services/ingested-entity-to-entity-mapper'
import { EntityChangeDetector } from '../domain/services/entity-change-detector'
import { Rundown } from '../../rundown-execution/domain/entities/rundown'
import { EntityTestFactory } from '../../rundown-execution/domain/entities/test/entity-test-factory'
import { IngestedRundown } from '../../rundown-execution/domain/entities/ingested-rundown'
import { RundownMode } from '../../rundown-execution/domain/enums/rundown-mode'
import { TakeMode } from '../../rundown-execution/domain/enums/take-mode'
import { Blueprint } from '../../rundown-execution/domain/value-objects/blueprint'
import { ConfigurationRepository } from '../../rundown-execution/domain/repositories/configuration-repository'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'

describe(IngestRundownSynchronizer.name, () => {
  describe(IngestRundownSynchronizer.prototype.synchronizeRundown.name, () => {
    describe('when the rundown metadata is unchanged', () => {
      it('does not return an updated rundown', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0 })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', modifiedAt: 0 })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedRundown).toBeUndefined()
      })

      describe('when segments has changes', () => {
        it('does not return an updated rundown', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0, segments: [] })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', modifiedAt: 0, ingestedSegments: [EntityTestFactory.createIngestedSegment()] })
          const testee: IngestRundownSynchronizer = createTestee()

          const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

          expect(result.updatedRundown).toBeUndefined()
        })
      })
    })

    describe('when the rundown mode has changed', () => {
      it('returns a rundown with the new metadata', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0, showStyleVariantId: 'show-style-variant-a' })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', modifiedAt: 100, showStyleVariantId: 'show-style-variant-b' })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedRundown?.getLastTimeModified()).toBe(100)
      })

      it('returns a rundown with the same rundown mode', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0, showStyleVariantId: 'show-style-variant-a', mode: RundownMode.ACTIVE })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', modifiedAt: 100, showStyleVariantId: 'show-style-variant-b' })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedRundown?.getMode()).toBe(RundownMode.ACTIVE)
      })

    })

    describe('when an initial rundown is created', () => {
      it('will have a default takeMode of STANDARD', () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0, showStyleVariantId: 'show-style-variant-a' })
        expect(rundown.getTakeMode()).toBe(TakeMode.STANDARD)
      })
    })

    describe('when a rundown has been modified through ingest', () => {
      it('will preserve its takeMode', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({ id: 'rundown-a', modifiedAt: 0, showStyleVariantId: 'show-style-variant-a', mode: RundownMode.ACTIVE, takeMode: TakeMode.RECALL })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({ id: 'rundown-a', modifiedAt: 100, showStyleVariantId: 'show-style-variant-b' })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedRundown?.getTakeMode()).toBe(TakeMode.RECALL)
      })
    })


    describe('when one or more segments are deleted', () => {
      it('returns a list of the deleted segments', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a' }),
            EntityTestFactory.createSegment({ id: 'segment-b', parts: [EntityTestFactory.createPart({ segmentId: 'segment-b' })] }),
            EntityTestFactory.createSegment({ id: 'segment-c' }),
            EntityTestFactory.createSegment({ id: 'segment-d' }),
            EntityTestFactory.createSegment({ id: 'segment-e', parts: [EntityTestFactory.createPart({ segmentId: 'segment-e' })] }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-b', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-b' })] }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-e', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-e', segmentId: 'segment-e' })] }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.deletedSegments.length).toBe(3)
        expect(result.deletedSegments).toEqual(expect.arrayContaining([
          expect.objectContaining({ id: 'segment-a' }),
          expect.objectContaining({ id: 'segment-c' }),
          expect.objectContaining({ id: 'segment-d' }),
        ]))
      })
    })

    describe('when segments are partless they are deleted', () => {
      it('returns a list of the deleted segments', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a' }),
            EntityTestFactory.createSegment({ id: 'segment-b', parts: [EntityTestFactory.createPart({ segmentId: 'segment-b' })] }),
            EntityTestFactory.createSegment({ id: 'segment-c' }),
            EntityTestFactory.createSegment({ id: 'segment-d' }),
            EntityTestFactory.createSegment({ id: 'segment-e', parts: [EntityTestFactory.createPart({ segmentId: 'segment-e' })] }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-b' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-e' }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.deletedSegments.length).toBe(5)
        expect(result.deletedSegments).toEqual(expect.arrayContaining([
          expect.objectContaining({ id: 'segment-a' }),
          expect.objectContaining({ id: 'segment-b' }),
          expect.objectContaining({ id: 'segment-c' }),
          expect.objectContaining({ id: 'segment-d' }),
          expect.objectContaining({ id: 'segment-e' }),
        ]))
      })

      describe('when the deleted segments have parts', () => {
        it('does not include the parts in the deleted parts list', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({
            id: 'rundown-a',
            segments: [
              EntityTestFactory.createSegment({ id: 'segment-a', parts: [EntityTestFactory.createPart({ segmentId: 'segment-a' })] }),
              EntityTestFactory.createSegment({ id: 'segment-b' }),
              EntityTestFactory.createSegment({ id: 'segment-c', parts: [EntityTestFactory.createPart({ segmentId: 'segment-c' }), EntityTestFactory.createPart({ segmentId: 'segment-c' })] }),
              EntityTestFactory.createSegment({ id: 'segment-d' }),
              EntityTestFactory.createSegment({ id: 'segment-e' }),
            ],
          })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
            id: 'rundown-a',
            ingestedSegments: [
              EntityTestFactory.createIngestedSegment({ id: 'segment-b' }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-e' }),
            ],
          })
          const testee: IngestRundownSynchronizer = createTestee()

          const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

          expect(result.deletedParts.length).toBe(0)
        })
      })
    })

    describe('when one or more segments are created', () => {
      it('returns a list of the created segments', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-b' }),
            EntityTestFactory.createSegment({ id: 'segment-e' }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-b' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-c' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-d' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-e' }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.createdSegments.length).toBe(3)
        expect(result.createdSegments).toEqual(expect.arrayContaining([
          expect.objectContaining({ id: 'segment-a' }),
          expect.objectContaining({ id: 'segment-c' }),
          expect.objectContaining({ id: 'segment-d' }),
        ]))
      })

      describe('when the created segments have parts', () => {
        it('only includes the parts in the created segments list', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({
            id: 'rundown-a',
            segments: [
              EntityTestFactory.createSegment({ id: 'segment-b' }),
              EntityTestFactory.createSegment({ id: 'segment-e' }),
            ],
          })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
            id: 'rundown-a',
            ingestedSegments: [
              EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a' })] }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-b' }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-c', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-a' }), EntityTestFactory.createIngestedPart({ id: 'part-c', segmentId: 'segment-a' })] }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-d' }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-e' }),
            ],
          })
          const testee: IngestRundownSynchronizer = createTestee()

          const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

          expect(result.createdParts.length).toBe(0)
          expect(result.createdSegments.flatMap(segment => segment.getParts())).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'part-a' }),
            expect.objectContaining({ id: 'part-b' }),
            expect.objectContaining({ id: 'part-c' }),
          ]))
        })
      })
    })

    describe('when one or more segments are updated', () => {
      it('returns a list of the updated segments', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a', name: 'A1' }),
            EntityTestFactory.createSegment({ id: 'segment-b', name: 'B1' }),
            EntityTestFactory.createSegment({ id: 'segment-c', name: 'C1' }),
            EntityTestFactory.createSegment({ id: 'segment-d', name: 'D1' }),
            EntityTestFactory.createSegment({ id: 'segment-e', name: 'E1' }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a', name: 'A2', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a' })] }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-b', name: 'B1' }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-c', name: 'C2', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-c', segmentId: 'segment-c' })] }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-d', name: 'D2', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-d', segmentId: 'segment-d' })] }),
            EntityTestFactory.createIngestedSegment({ id: 'segment-e', name: 'E1' }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedSegments.length).toBe(3)
        expect(result.updatedSegments).toEqual(expect.arrayContaining([
          expect.objectContaining({ id: 'segment-a', name: 'A2' }),
          expect.objectContaining({ id: 'segment-c', name: 'C2' }),
          expect.objectContaining({ id: 'segment-d', name: 'D2' }),
        ]))
      })

      describe('when the updated segments have updated parts', () => {
        it('only includes the updated parts in the updated segment lists', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({
            id: 'rundown-a',
            segments: [
              EntityTestFactory.createSegment({ id: 'segment-a', name: 'A1', parts: [EntityTestFactory.createPart({ id: 'part-a', segmentId: 'segment-a', name: 'PA1' })] }),
              EntityTestFactory.createSegment({ id: 'segment-b', name: 'B1' }),
              EntityTestFactory.createSegment({ id: 'segment-c', name: 'C1', parts: [EntityTestFactory.createPart({ id: 'part-b', segmentId: 'segment-c', name: 'PB1' }), EntityTestFactory.createPart({ id: 'part-c', segmentId: 'segment-c', name: 'PC1' })] }),
              EntityTestFactory.createSegment({ id: 'segment-d', name: 'D1' }),
              EntityTestFactory.createSegment({ id: 'segment-e', name: 'E1' }),
            ],
          })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
            id: 'rundown-a',
            ingestedSegments: [
              EntityTestFactory.createIngestedSegment({ id: 'segment-a', name: 'A2', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'PA2' })] }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-b', name: 'B1' }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-c', name: 'C2', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-c', name: 'PB1' }), EntityTestFactory.createIngestedPart({ id: 'part-c', segmentId: 'segment-c', name: 'PC2' })] }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-d', name: 'D2' }),
              EntityTestFactory.createIngestedSegment({ id: 'segment-e', name: 'E1' }),
            ],
          })
          const testee: IngestRundownSynchronizer = createTestee()

          const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

          expect(result.updatedParts.length).toBe(0)
          expect(result.updatedSegments.flatMap(segment => segment.getParts())).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'part-a', name: 'PA2' }),
            expect.objectContaining({ id: 'part-b', name: 'PB1' }),
            expect.objectContaining({ id: 'part-c', name: 'PC2' }),
          ]))
        })
      })
    })

    describe('when a part is created on an unaffected segment', () => {
      it('returns a part created-list that holds the created part', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a' }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a' })] }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.createdParts.length).toBe(1)
        expect(result.createdParts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'part-a' })]))
      })
    })

    describe('when a part is deleted on an unaffected segment', () => {
      it('returns a part deleted-list that holds the deleted part', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a', parts: [EntityTestFactory.createPart({ id: 'part-a', segmentId: 'segment-a' }),EntityTestFactory.createPart({ id: 'part-b', segmentId: 'segment-a' })] }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-a' })] }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.deletedParts.length).toBe(1)
        expect(result.deletedParts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'part-a' })]))
      })
    })

    describe('when a part is updated on an unaffected segment', () => {
      it('returns a part updated-list that holds the updated part', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a', parts: [
              EntityTestFactory.createPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1', ingestedPart: EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1' }) }),
              EntityTestFactory.createPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1', ingestedPart: EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1' }) })] }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'A2' }), EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1' })] }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.updatedParts.length).toBe(1)
        expect(result.updatedParts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'part-a', name: 'A2' })]))
      })

      describe('when the part is on air', () => {
        it('marks the on air part for deletion and creates a new part with the updated data', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({
            id: 'rundown-a',
            segments: [
              EntityTestFactory.createSegment({ id: 'segment-a', parts: [
                EntityTestFactory.createPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1', isOnAir: true, ingestedPart: EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1' }) }),
                EntityTestFactory.createPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1', ingestedPart: EntityTestFactory.createIngestedPart({  id: 'part-b', segmentId: 'segment-a', name: 'B1' }) })] }),
            ],
          })
          const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
            id: 'rundown-a',
            ingestedSegments: [
              EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'A2' }), EntityTestFactory.createIngestedPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1' })] }),
            ],
          })
          const testee: IngestRundownSynchronizer = createTestee()

          const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

          expect(result.updatedParts.length).toBe(0)
          expect(result.createdParts.length).toBe(1)
          expect(result.createdParts).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'part-a', name: 'A2' })]))
          expect(result.deletedParts.length).toBe(1)
          expect(result.deletedParts).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'A1' })]))
        })
      })
    })

    describe('when a part is unplanned', () => {
      it('ignores the part', async () => {
        const rundown: Rundown = EntityTestFactory.createRundown({
          id: 'rundown-a',
          segments: [
            EntityTestFactory.createSegment({ id: 'segment-a', parts: [EntityTestFactory.createPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1' }), EntityTestFactory.createPart({ id: 'part-b', segmentId: 'segment-a', name: 'B1', ingestedPart: undefined })] }),
          ],
        })
        const ingestedRundown: IngestedRundown = EntityTestFactory.createIngestedRundown({
          id: 'rundown-a',
          ingestedSegments: [
            EntityTestFactory.createIngestedSegment({ id: 'segment-a', ingestedParts: [EntityTestFactory.createIngestedPart({ id: 'part-a', segmentId: 'segment-a', name: 'A1' })] }),
          ],
        })
        const testee: IngestRundownSynchronizer = createTestee()

        const result: RundownSynchronizeResult = await testee.synchronizeRundown(rundown, ingestedRundown)

        expect(result.deletedParts.length).toBe(0)
      })
    })
  })
})

function createTestee(
  params: {
    ingestedEntityToEntityMapper?: IngestedEntityToEntityMapper,
    entityChangeDetector?: EntityChangeDetector,
    blueprint?: Blueprint,
    configurationRepository?: ConfigurationRepository
  } = {}
): IngestRundownSynchronizer {
  let blueprint: Blueprint
  if (!params.blueprint) {
    const mockBlueprint: Blueprint = mock<Blueprint>()
    when(mockBlueprint.generateBaselinePieces(anything(), anything())).thenReturn([])
    blueprint = instance(mockBlueprint)
  } else {
    blueprint = params.blueprint
  }


  return new IngestRundownSynchronizer(
    params.ingestedEntityToEntityMapper ?? new IngestedEntityToEntityMapper(),
    params.entityChangeDetector ?? new EntityChangeDetector(),
    blueprint,
    params.configurationRepository ?? instance(mock<ConfigurationRepository>())
  )
}
