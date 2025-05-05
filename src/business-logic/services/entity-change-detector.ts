import { Segment } from '../../model/entities/segment'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Part } from '../../model/entities/part'
import { IngestedPart } from '../../model/entities/ingested-part'
import { IngestedPiece } from '../../model/entities/ingested-piece'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Rundown } from '../../model/entities/rundown'
import { Piece } from '../../model/entities/piece'
import { PieceLifespan } from '../../model/enums/piece-lifespan'

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
      || this.hasLifeSpanPieceChanges(segment, ingestSegment)
  }

  private hasLifeSpanPieceChanges(segment: Segment, ingestedSegment: IngestedSegment): boolean {
    const pieces: Piece[] = segment.getParts().flatMap(part => part.getPieces())
    const ingestedPieces: IngestedPiece[] = ingestedSegment.ingestedParts.flatMap(part => part.ingestedPieces)
    const differingPieces: Piece[] = pieces.filter(piece => !ingestedPieces.some(ingestedPiece => ingestedPiece.id === piece.id))
    const spanningLifeSpans: PieceLifespan[] = [PieceLifespan.SPANNING_UNTIL_RUNDOWN_END, PieceLifespan.SPANNING_UNTIL_SEGMENT_END, PieceLifespan.START_SPANNING_SEGMENT_THEN_STICKY_RUNDOWN]

    const hasNewSpanningPieces: boolean = differingPieces.some((piece) => spanningLifeSpans.includes(piece.pieceLifespan))
    const hasPiecesWithChangedLifespan: boolean = pieces.some((piece) => {
      const ingestedPiece: IngestedPiece | undefined = ingestedPieces.find(ingestedPiece => ingestedPiece.id === piece.id)
      return ingestedPiece && this.doesIngestedPiecesDifferInLifeSpan(piece, ingestedPiece)
    })

    return hasPiecesWithChangedLifespan || hasNewSpanningPieces
  }

  private doesIngestedPiecesDifferInLifeSpan(ingestedPieceA: Piece, ingestPieceB: IngestedPiece): boolean {
    return ingestedPieceA.pieceLifespan !== ingestPieceB.pieceLifespan
  }

  public doesIngestedPartOnPartDifferFromIngestedPart(part: Part, ingestedPart: IngestedPart): boolean {
    return part.ingestedPart !== undefined && this.doesIngestedPartsDiffer(part.ingestedPart, ingestedPart)
  }

  private doesIngestedPartsDiffer(ingestedPartA: IngestedPart, ingestedPartB: IngestedPart): boolean {
    return ingestedPartA.name !== ingestedPartB.name
      || ingestedPartA.rank !== ingestedPartB.rank
      || ingestedPartA.expectedDuration !== ingestedPartB.expectedDuration
      || ingestedPartA.invalidity?.reason !== ingestedPartB.invalidity?.reason
      || this.serializeComplexTypeForComparison(ingestedPartA.inTransition) !== this.serializeComplexTypeForComparison(ingestedPartB.inTransition)
      || this.serializeComplexTypeForComparison(ingestedPartA.outTransition) !== this.serializeComplexTypeForComparison(ingestedPartB.outTransition)
      || ingestedPartA.autoNext?.overlap !== ingestedPartB.autoNext?.overlap
      || this.doesIngestedPieceSequencesDiffer(ingestedPartA.ingestedPieces, ingestedPartB.ingestedPieces)
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
