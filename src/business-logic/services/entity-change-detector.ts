import { Segment } from '../../model/entities/segment'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Part } from '../../model/entities/part'
import { IngestedPart } from '../../model/entities/ingested-part'
import { IngestedPiece } from '../../model/entities/ingested-piece'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Rundown } from '../../model/entities/rundown'

export class EntityChangeDetector {
  public doesShallowRundownDifferFromIngestedRundown(rundown: Rundown, ingestedRundown: IngestedRundown): boolean {
    return rundown.name !== ingestedRundown.name
      || rundown.getShowStyleVariantId() !== ingestedRundown.showStyleVariantId
      || rundown.getLastTimeModified() !== ingestedRundown.modifiedAt
      || this.serializeComplexTypeForComparison(rundown.timing) !== this.serializeComplexTypeForComparison(ingestedRundown.timings)
      || this.serializeComplexTypeForComparison(rundown.getBaseline()) !== this.serializeComplexTypeForComparison(ingestedRundown.baselineTimelineObjects)
  }

  private serializeComplexTypeForComparison(value: unknown): string {
    const text: string = JSON.stringify(value, (_, v) => v ?? null)
    return this.removeIdAttributeFromJson(text)
  }

  private removeIdAttributeFromJson(text: string): string {
    return text.replaceAll(/"id"\s*:\s*"\d+"/gi, '')
  }

  public doesShallowSegmentDifferFromIngestSegment(segment: Segment, ingestSegment: IngestedSegment): boolean {
    return segment.name !== ingestSegment.name
      || segment.rank !== ingestSegment.rank
      || segment.isHidden !== ingestSegment.isHidden
      || segment.referenceTag !== ingestSegment.referenceTag
      || this.serializeComplexTypeForComparison(segment.metadata) !== this.serializeComplexTypeForComparison(ingestSegment.metadata)
      || segment.expectedDurationInMs !== ingestSegment.budgetDuration
      || segment.invalidity?.reason !== ingestSegment.invalidity?.reason
      || segment.definesShowStyleVariant !== ingestSegment.definesShowStyleVariant
  }

  public doesPartDifferFromIngestPart(part: Part, ingestPart: IngestedPart): boolean {
    return part.name !== ingestPart.name
      || part.getRank() !== ingestPart.rank
      || part.expectedDuration !== ingestPart.expectedDuration
      || part.invalidity?.reason !== ingestPart.invalidity?.reason
      || this.serializeComplexTypeForComparison(part.getInTransition()) !== this.serializeComplexTypeForComparison(ingestPart.inTransition)
      || this.serializeComplexTypeForComparison(part.outTransition) !== this.serializeComplexTypeForComparison(ingestPart.outTransition)
      || part.autoNext?.overlap !== ingestPart.autoNext?.overlap
      || part.ingestedPart !== undefined && this.doesIngestedPieceSequencesDiffer(part.ingestedPart.ingestedPieces, ingestPart.ingestedPieces)
  }

  private doesIngestedPieceSequencesDiffer(ingestedPieceSequenceA: readonly IngestedPiece[], ingstedPieceSequenceB: readonly IngestedPiece[]): boolean {
    return ingestedPieceSequenceA.length !== ingstedPieceSequenceB.length
      || ingestedPieceSequenceA.some((ingestedPieceA) => {
        const ingestedPieceB: IngestedPiece | undefined = ingstedPieceSequenceB.find(ingestedPiece => ingestedPiece.id === ingestedPieceA.id)
        return !ingestedPieceB || this.doesIngestedPiecesDiffer(ingestedPieceA, ingestedPieceB)
      })
  }

  public doesIngestedPiecesDiffer(ingestedPieceA: IngestedPiece, ingestPieceB: IngestedPiece): boolean {
    return ingestedPieceA.name !== ingestPieceB.name
      || ingestedPieceA.layer !== ingestPieceB.layer
      || ingestedPieceA.pieceLifespan !== ingestPieceB.pieceLifespan
      || ingestedPieceA.start !== ingestPieceB.start
      || ingestedPieceA.duration !== ingestPieceB.duration
      || ingestedPieceA.preRollDuration !== ingestPieceB.preRollDuration
      || ingestedPieceA.postRollDuration !== ingestPieceB.postRollDuration
      || ingestedPieceA.transitionType !== ingestPieceB.transitionType
      || this.serializeComplexTypeForComparison(ingestedPieceA.timelineObjects) !== this.serializeComplexTypeForComparison(ingestPieceB.timelineObjects)
      || this.serializeComplexTypeForComparison(ingestedPieceA.metadata) !== this.serializeComplexTypeForComparison(ingestPieceB.metadata)
      || this.serializeComplexTypeForComparison(ingestedPieceA.content) !== this.serializeComplexTypeForComparison(ingestPieceB.content)
  }
}
