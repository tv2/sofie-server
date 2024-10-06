import { Rundown } from '../../model/entities/rundown'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Segment } from '../../model/entities/segment'
import { Part } from '../../model/entities/part'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { IngestedPart } from '../../model/entities/ingested-part'
import { IngestEntityDiffer } from './ingest-entity-differ'

export interface RundownSynchronizeResult {
  // readonly rundown: Rundown
  readonly createdSegments: readonly Segment[]
  readonly updatedSegments: readonly Segment[]
  // readonly deletedSegments: readonly DeletedSegment[]
  readonly deletedSegments: readonly Segment[]
  readonly createdParts: readonly Part[]
  readonly updatedParts: readonly Part[]
  readonly deletedParts: readonly Part[]
}
// TODO: Maybe move the original id into the entity to have it be part of the unsynced state.
export interface DeletedSegment {
  readonly originalSegmentId: string
  readonly segment: Segment
}

export class IngestRundownSynchronizer {
  constructor(
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    private readonly ingestEntityDiffer: IngestEntityDiffer,
  ) {}

  public synchronizeRundown(originalRundown: Rundown, ingestedRundown: IngestedRundown): RundownSynchronizeResult {
    // const rundown: Rundown = new Rundown(originalRundown.toRundownInterface())

    // TODO: Add check rundown metadata changes.

    const ingestedSegmentIds: ReadonlySet<string> = new Set(ingestedRundown.ingestedSegments.map(ingestedSegment => ingestedSegment.id))
    const deletedSegments: readonly Segment[] = originalRundown.getSegments()
      .filter(segment => !ingestedSegmentIds.has(segment.id))

    const segmentIds: ReadonlySet<string> = new Set(originalRundown.getSegments().map(segment => segment.id))
    const createdSegments: readonly Segment[] = ingestedRundown.ingestedSegments
      .filter(ingestedSegment => !segmentIds.has(ingestedSegment.id))
      .map(ingestedSegment => this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment))

    const createdSegmentIds: ReadonlySet<string> = new Set(createdSegments.map(segment => segment.id))
    const updatedSegments: readonly Segment[] = ingestedRundown.ingestedSegments
      .reduce<readonly Segment[]>((updatedSegments, ingestedSegment) => {
      if (createdSegmentIds.has(ingestedSegment.id)) {
        return updatedSegments
      }
      const segment: Segment | undefined = originalRundown.getSegments().find(segment => segment.id === ingestedSegment.id)
      if (!segment) {
        // TODO: Should this throw an error?
        return updatedSegments
      }
      if (!this.ingestEntityDiffer.doesSegmentDifferFromIngestSegment(segment, ingestedSegment)) {
        return updatedSegments
      }
      return [
        ...updatedSegments,
        this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segment, ingestedSegment),
      ]
    }, [])

    const parts: readonly Part[] = originalRundown.getSegments().flatMap(segment => segment.getParts())

    const ingestedParts: readonly IngestedPart[] = ingestedRundown.ingestedSegments.flatMap(ingestedSegment => ingestedSegment.ingestedParts)
    const ingestedPartIds: ReadonlySet<string> = new Set(ingestedParts.map(ingestedPart => ingestedPart.id))

    const deletedParts: readonly Part[] = parts.filter(part => !ingestedPartIds.has(part.id))

    const partIds: ReadonlySet<string> = new Set(parts.map(part => part.id))
    const affectedSegmentIds: ReadonlySet<string> = new Set([...createdSegmentIds, ...updatedSegments.map(segment => segment.id), ...deletedSegments.map(segment => segment.id)])
    const createdParts: readonly Part[] = ingestedParts
      .filter(ingestedPart => !partIds.has(ingestedPart.id) && !affectedSegmentIds.has(ingestedPart.segmentId))
      .map(ingestedPart => this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart))

    const createdPartIds: ReadonlySet<string> = new Set(createdParts.map(part => part.id))
    const updatedParts: readonly Part[] = ingestedParts
      .reduce<readonly Part[]>((updatedParts, ingestedPart) => {
      if (createdPartIds.has(ingestedPart.id)) {
        return updatedParts
      }
      const part: Part | undefined = parts.find(part => part.id === ingestedPart.id)
      if (!part) {
        // TODO: Should this throw an error?
        return updatedParts
      }
      if (!this.ingestEntityDiffer.doesPartDifferFromIngestPart(part, ingestedPart)) {
        return updatedParts
      }
      return [
        ...updatedParts,
        this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(part, ingestedPart)
      ]
    }, [])

    return {
      createdSegments,
      updatedSegments,
      deletedSegments,
      createdParts,
      updatedParts,
      deletedParts,
    }
  }
}
