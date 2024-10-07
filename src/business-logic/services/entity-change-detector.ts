import { Segment } from '../../model/entities/segment'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Part } from '../../model/entities/part'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Piece } from '../../model/entities/piece'
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
      || this.doesPiecesDifferFromIngestPieces(part.getPieces(), ingestPart.ingestedPieces)
  }

  private doesPiecesDifferFromIngestPieces(pieces: readonly Piece[], ingestedPieces: readonly IngestedPiece[]): boolean {
    return pieces.length !== ingestedPieces.length
      || pieces.some((piece) => {
        const ingestedPiece: IngestedPiece | undefined = ingestedPieces.find(ingestedPiece => ingestedPiece.id === piece.id)
        return !ingestedPiece || this.doesPieceDifferFromIngestPiece(piece, ingestedPiece)
      })
  }

  public doesPieceDifferFromIngestPiece(piece: Piece, ingestPiece: IngestedPiece): boolean {
    return piece.name !== ingestPiece.name
      || piece.layer !== ingestPiece.layer
      || piece.pieceLifespan !== ingestPiece.pieceLifespan
      || piece.getStart() !== ingestPiece.start
      || piece.getDuration() !== ingestPiece.duration
      || piece.preRollDuration !== ingestPiece.preRollDuration
      || piece.postRollDuration !== ingestPiece.postRollDuration
      || piece.transitionType !== ingestPiece.transitionType
      || this.serializeComplexTypeForComparison(piece.getTimelineObjects()) !== this.serializeComplexTypeForComparison(ingestPiece.timelineObjects)
      || this.serializeComplexTypeForComparison(piece.metadata) !== this.serializeComplexTypeForComparison(ingestPiece.metadata)
      || this.serializeComplexTypeForComparison(piece.content) !== this.serializeComplexTypeForComparison(ingestPiece.content)
  }
}
