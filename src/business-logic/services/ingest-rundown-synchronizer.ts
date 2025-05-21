import { Rundown } from '../../model/entities/rundown'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Segment } from '../../model/entities/segment'
import { Part } from '../../model/entities/part'
import { IngestedEntityToEntityMapper } from './ingested-entity-to-entity-mapper'
import { IngestedPart } from '../../model/entities/ingested-part'
import { EntityChangeDetector } from './entity-change-detector'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Blueprint } from '../../model/value-objects/blueprint'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { Configuration } from '../../model/entities/configuration'
import { Piece } from '../../model/entities/piece'

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
    private readonly blueprint: Blueprint,
    private readonly configurationRepository: ConfigurationRepository
  ) {}

  public async synchronizeRundown(rundown: Rundown, ingestedRundown: IngestedRundown): Promise<RundownSynchronizeResult> {
    const partLessIngestedSegmentIds: ReadonlySet<string> = this.getPartlessSegmentIds(ingestedRundown.ingestedSegments)
    const updatedRundown: Rundown | undefined = await this.getUpdatedRundown(rundown, ingestedRundown)

    const createdSegments: readonly Segment[] = this.getCreatedSegments(rundown.getSegments(), ingestedRundown.ingestedSegments)
    const updatedSegments: readonly Segment[] = this.getUpdatedSegments(rundown.getSegments(), ingestedRundown.ingestedSegments, partLessIngestedSegmentIds)
    const deletedSegments: readonly Segment[] = this.getDeletedSegments(rundown.getSegments(), ingestedRundown.ingestedSegments, partLessIngestedSegmentIds)

    const affectedSegmentIds: ReadonlySet<string> = new Set([
      ...createdSegments.map(segment => segment.id),
      ...updatedSegments.map(segment => segment.id),
      ...deletedSegments.map(segment => segment.id),
    ])

    const parts: readonly Part[] = rundown.getSegments().flatMap(segment => segment.getParts())
    const ingestedParts: readonly IngestedPart[] = ingestedRundown.ingestedSegments.flatMap(ingestedSegment => ingestedSegment.ingestedParts)

    const createdParts: readonly Part[] = this.getCreatedParts(parts, ingestedParts, affectedSegmentIds)
    const updatedParts: readonly Part[] = this.getUpdatedParts(parts, ingestedParts, affectedSegmentIds)
    const deletedParts: readonly Part[] = this.getDeletedParts(parts, ingestedParts, deletedSegments)

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

  private async getUpdatedRundown(rundown: Rundown, ingestedRundown: IngestedRundown): Promise<Rundown | undefined> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const baselinePiecesForRundown: Piece[] = this.blueprint.generateBaselinePieces(rundown.id, configuration)
    rundown.updateBaselinePieces(baselinePiecesForRundown)

    if (this.ingestEntityDiffer.doesShallowRundownDifferFromIngestedRundown(rundown, ingestedRundown)) {
      return this.ingestedEntityToEntityMapper.updateRundownFromIngestedRundown(rundown, ingestedRundown)
    }
  }

  private getCreatedSegments(segments: readonly Segment[], ingestedSegments: readonly IngestedSegment[]): readonly Segment[] {
    const segmentIds: ReadonlySet<string> = new Set(segments.map(segment => segment.id))
    return ingestedSegments
      .filter(ingestedSegment => !segmentIds.has(ingestedSegment.id))
      .map(ingestedSegment => this.ingestedEntityToEntityMapper.convertIngestedSegmentToSegment(ingestedSegment))
  }

  private getUpdatedSegments(segments: readonly Segment[], ingestedSegments: readonly IngestedSegment[], partLessIngestedSegmentIds: ReadonlySet<string>): readonly Segment[] {
    return ingestedSegments.reduce<readonly Segment[]>((updatedSegments, ingestedSegment) => {
      const segment: Segment | undefined = segments.find(segment => segment.id === ingestedSegment.id && !partLessIngestedSegmentIds.has(segment.id))
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
  }

  private getDeletedSegments(segments: readonly Segment[], ingestedSegments: readonly IngestedSegment[], partLessIngestedSegmentIds: ReadonlySet<string>): readonly Segment[] {
    const ingestedSegmentIds: ReadonlySet<string> = new Set(ingestedSegments.map(ingestedSegment => ingestedSegment.id))
    return segments.filter(segment => !segment.isUnsynced() && !ingestedSegmentIds.has(segment.id) || partLessIngestedSegmentIds.has(segment.id))
  }

  private getPartlessSegmentIds(ingestedSegments: readonly IngestedSegment[]): ReadonlySet<string> {
    return new Set(ingestedSegments.filter(segment => segment.ingestedParts.length === 0).map(segment => segment.id))
  }

  private getCreatedParts(parts: readonly Part[], ingestedParts: readonly IngestedPart[], affectedSegmentIds: ReadonlySet<string>): readonly Part[] {
    const partIds: ReadonlySet<string> = new Set(parts.map(part => part.id))
    return ingestedParts
      .filter(ingestedPart => !partIds.has(ingestedPart.id) && !affectedSegmentIds.has(ingestedPart.segmentId) || this.isPartOnAirAndUpdated(ingestedPart.id, parts, ingestedParts))
      .map(ingestedPart => this.ingestedEntityToEntityMapper.convertIngestedPartToPart(ingestedPart))
  }

  private getUpdatedParts(parts: readonly Part[], ingestedParts: readonly IngestedPart[], affectedSegmentIds: ReadonlySet<string>): readonly Part[] {
    return ingestedParts.reduce<readonly Part[]>(
      (updatedParts, ingestedPart) => {
        const part: Part | undefined = parts.find(part => part.id === ingestedPart.id)
        if (!part || part.isOnAir() || affectedSegmentIds.has(ingestedPart.segmentId)) {
          return updatedParts
        }
        if (!this.ingestEntityDiffer.doesIngestedPartOnPartDifferFromIngestedPart(part, ingestedPart)) {
          return updatedParts
        }
        return [
          ...updatedParts,
          this.ingestedEntityToEntityMapper.updatePartWithIngestedPart(part, ingestedPart)
        ]
      },
      []
    )
  }

  private getDeletedParts(parts: readonly Part[], ingestedParts: readonly IngestedPart[], deletedSegments: readonly Segment[]): readonly Part[] {
    const ingestedPartIds: ReadonlySet<string> = new Set(ingestedParts.map(ingestedPart => ingestedPart.id))
    const deletedSegmentIds: ReadonlySet<string> = new Set(deletedSegments.map(segment => segment.id))
    return parts.reduce<Part[]>((deletedParts, part) => {
      if (part.isPlanned && !part.isUnsynced() && !ingestedPartIds.has(part.id) && !deletedSegmentIds.has(part.getSegmentId()) || this.isPartOnAirAndUpdated(part.id, parts, ingestedParts)) {
        return [...deletedParts, part]
      }

      if (!part.isOnAir()) {
        return deletedParts
      }

      const ingestedPart: IngestedPart | undefined = ingestedParts.find(ingestedPart => part.id === ingestedPart.id)
      if (ingestedPart && this.ingestEntityDiffer.doesIngestedPartOnPartDifferFromIngestedPart(part, ingestedPart)) {
        return [...deletedParts, part]
      }
      return deletedParts
    }, [])
  }

  private isPartOnAirAndUpdated(partId: string, parts: readonly Part[], ingestedParts: readonly IngestedPart[]): boolean {
    const part: Part | undefined = parts.find(part => part.id === partId)
    const ingestedPart: IngestedPart | undefined = ingestedParts.find(part => part.id === partId)
    if (!part || !ingestedPart) {
      return false
    }
    return part.isOnAir() && this.ingestEntityDiffer.doesIngestedPartOnPartDifferFromIngestedPart(part, ingestedPart)
  }
}
