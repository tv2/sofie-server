import { Rundown } from '../../model/entities/rundown'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Segment } from '../../model/entities/segment'
import { Part } from '../../model/entities/part'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { IngestedPart } from '../../model/entities/ingested-part'
import { EntityChangeDetector } from './entity-change-detector'

export interface RundownSynchronizeResult {
  readonly updatedRundown: Rundown | undefined
  readonly createdSegments: readonly Segment[]
  readonly updatedSegments: readonly Segment[]
  readonly deletedSegments: readonly Segment[]
  readonly createdParts: readonly Part[]
  readonly updatedParts: readonly Part[]
  readonly deletedParts: readonly Part[]
}

export class IngestRundownSynchronizer {
  constructor(
    private readonly ingestedEntityToEntityMapper: IngestedEntityToEntityMapper,
    private readonly ingestEntityDiffer: EntityChangeDetector,
  ) {}

  public synchronizeRundown(rundown: Rundown, ingestedRundown: IngestedRundown): RundownSynchronizeResult {
    const updatedRundown: Rundown | undefined = this.ingestEntityDiffer.doesShallowRundownDifferFromIngestedRundown(rundown, ingestedRundown) ? this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(rundown, ingestedRundown) : undefined

    const ingestedSegmentIds: ReadonlySet<string> = new Set(ingestedRundown.ingestedSegments.map(ingestedSegment => ingestedSegment.id))
    const deletedSegments: readonly Segment[] = rundown.getSegments()
      .filter(segment => !segment.isUnsynced() && !ingestedSegmentIds.has(segment.id))

    const segmentIds: ReadonlySet<string> = new Set(rundown.getSegments().map(segment => segment.id))
    const createdSegments: readonly Segment[] = ingestedRundown.ingestedSegments
      .filter(ingestedSegment => !segmentIds.has(ingestedSegment.id))
      .map(ingestedSegment => this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment))

    const createdSegmentIds: ReadonlySet<string> = new Set(createdSegments.map(segment => segment.id))
    const updatedSegments: readonly Segment[] = ingestedRundown.ingestedSegments.reduce<readonly Segment[]>((updatedSegments, ingestedSegment) => {
      if (createdSegmentIds.has(ingestedSegment.id)) {
        return updatedSegments
      }
      const segment: Segment | undefined = rundown.getSegments().find(segment => segment.id === ingestedSegment.id)
      if (!segment) {
        return updatedSegments
      }
      if (!this.ingestEntityDiffer.doesShallowSegmentDifferFromIngestSegment(segment, ingestedSegment)) {
        return updatedSegments
      }
      return [
        ...updatedSegments,
        this.ingestedEntityToEntityMapper.updateSegmentWithIngestedSegment(segment, ingestedSegment),
      ]
    }, [])

    const parts: readonly Part[] = rundown.getSegments().flatMap(segment => segment.getParts())

    const ingestedParts: readonly IngestedPart[] = ingestedRundown.ingestedSegments.flatMap(ingestedSegment => ingestedSegment.ingestedParts)
    const ingestedPartIds: ReadonlySet<string> = new Set(ingestedParts.map(ingestedPart => ingestedPart.id))

    const partIds: ReadonlySet<string> = new Set(parts.map(part => part.id))
    const affectedSegmentIds: ReadonlySet<string> = new Set([...createdSegmentIds, ...updatedSegments.map(segment => segment.id), ...deletedSegments.map(segment => segment.id)])
    const createdParts: readonly Part[] = ingestedParts
      .filter(ingestedPart => (!partIds.has(ingestedPart.id) || this.isPartOnAirAndUpdated(ingestedPart.id, parts, ingestedParts)) && !affectedSegmentIds.has(ingestedPart.segmentId))
      .map(ingestedPart => this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart))

    const createdPartIds: ReadonlySet<string> = new Set(createdParts.map(part => part.id))
    const updatedParts: readonly Part[] = ingestedParts
      .reduce<readonly Part[]>((updatedParts, ingestedPart) => {
      if (createdPartIds.has(ingestedPart.id) || affectedSegmentIds.has(ingestedPart.segmentId)) {
        return updatedParts
      }
      const part: Part | undefined = parts.find(part => part.id === ingestedPart.id)
      if (!part || part.isOnAir()) {
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

    const deletedSegmentIds: ReadonlySet<string> = new Set(deletedSegments.map(segment => segment.id))
    const deletedParts: readonly Part[] = parts.reduce<Part[]>((deletedParts, part) => {
      if (part.isPlanned && !part.isUnsynced() && !ingestedPartIds.has(part.id) && !deletedSegmentIds.has(part.getSegmentId())) {
        return [...deletedParts, part]
      }

      if (!part.isOnAir()) {
        return deletedParts
      }

      const ingestedPart: IngestedPart | undefined = ingestedParts.find(ingestedPart => part.id === ingestedPart.id)
      if (ingestedPart && this.ingestEntityDiffer.doesPartDifferFromIngestPart(part, ingestedPart)) {
        return [...deletedParts, part]
      }
      return deletedParts
    }, [])

    return {
      updatedRundown,
      createdSegments,
      updatedSegments,
      deletedSegments,
      createdParts,
      updatedParts,
      deletedParts,
    }
  }

  private isPartOnAirAndUpdated(partId: string, parts: readonly Part[], ingestedParts: readonly IngestedPart[]): boolean {
    const part: Part | undefined = parts.find(part => part.id === partId)
    const ingestedPart: IngestedPart | undefined = ingestedParts.find(part => part.id === partId)
    if (!part || !ingestedPart) {
      return false
    }
    return part.isOnAir() && this.ingestEntityDiffer.doesPartDifferFromIngestPart(part, ingestedPart)
  }
}
