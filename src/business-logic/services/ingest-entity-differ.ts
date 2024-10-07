import { Segment } from '../../model/entities/segment'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Part } from '../../model/entities/part'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Piece } from '../../model/entities/piece'
import { IngestedPiece } from '../../model/entities/ingested-piece'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Rundown } from '../../model/entities/rundown'

export class IngestEntityDiffer {
  public doesShallowRundownDifferFromIngestedRundown(rundown: Rundown, ingestedRundown: IngestedRundown): boolean {
    return rundown.name !== ingestedRundown.name
      || rundown.getShowStyleVariantId() !== ingestedRundown.showStyleVariantId
      || rundown.getLastTimeModified() !== ingestedRundown.modifiedAt
      || JSON.stringify(rundown.timing) !== JSON.stringify(ingestedRundown.timings)
      || JSON.stringify(rundown.getBaseline()) !== JSON.stringify(ingestedRundown.baselineTimelineObjects)
  }

  public doesShallowSegmentDifferFromIngestSegment(segment: Segment, ingestSegment: IngestedSegment): boolean {
    return segment.name !== ingestSegment.name
      || segment.rank !== ingestSegment.rank
      || segment.isHidden !== ingestSegment.isHidden
      || segment.referenceTag !== ingestSegment.referenceTag
      || JSON.stringify(segment.metadata) !== JSON.stringify(ingestSegment.metadata)
      || segment.expectedDurationInMs !== ingestSegment.budgetDuration
      || segment.invalidity?.reason !== ingestSegment.invalidity?.reason
      || segment.definesShowStyleVariant !== ingestSegment.definesShowStyleVariant
  }

  public doesPartDifferFromIngestPart(part: Part, ingestPart: IngestedPart): boolean {
    return part.name !== ingestPart.name
      || part.getRank() !== ingestPart.rank
      || part.expectedDuration !== ingestPart.expectedDuration
      || part.invalidity?.reason !== ingestPart.invalidity?.reason
      || JSON.stringify(part.getInTransition()) !== JSON.stringify(ingestPart.inTransition)
      || JSON.stringify(part.outTransition) !== JSON.stringify(ingestPart.outTransition)
      || part.autoNext?.overlap !== ingestPart.autoNext?.overlap
      // || JSON.stringify(part.getTimings()) !== JSON.stringify(ingestPart.timings)
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
      || JSON.stringify(piece.getTimelineObjects()).replaceAll(/"id"\s*:\s*"\d+"/gi, '') !== JSON.stringify(ingestPiece.timelineObjects).replaceAll(/"id"\s*:\s*"\d+"/gi, '')
      || JSON.stringify(piece.metadata).replaceAll(/"id"\s*:\s*"\d+"/gi, '') !== JSON.stringify(ingestPiece.metadata).replaceAll(/"id"\s*:\s*"\d+"/gi, '')
      || JSON.stringify(piece.content) !== JSON.stringify(ingestPiece.content)
  }
}
