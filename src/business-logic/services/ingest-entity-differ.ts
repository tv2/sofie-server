import { Segment } from '../../model/entities/segment'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Part } from '../../model/entities/part'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Piece } from '../../model/entities/piece'
import { IngestedPiece } from '../../model/entities/ingested-piece'

export class IngestEntityDiffer {
  public doesSegmentDifferFromIngestSegment(segment: Segment, ingestSegment: IngestedSegment): boolean {
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

  private doesPiecesDifferFromIngestPieces(pieces: readonly Piece[], ingestPieces: readonly IngestedPiece[]): boolean {
    return pieces.length !== ingestPieces.length
    || pieces.some((piece, pieceIndex) => {
      const ingestPiece: IngestedPiece | undefined = ingestPieces[pieceIndex]
      return !ingestPiece || this.doesPieceDifferFromIngestPiece(piece, ingestPiece)
    })
  }

  public doesPieceDifferFromIngestPiece(piece: Piece, ingestPiece: IngestedPiece): boolean {
    return piece.name !== ingestPiece.name
      && piece.layer !== ingestPiece.layer
      && piece.pieceLifespan !== ingestPiece.pieceLifespan
      && piece.getStart() !== ingestPiece.start
      && piece.getDuration() !== ingestPiece.duration
      && piece.preRollDuration !== ingestPiece.preRollDuration
      && piece.postRollDuration !== ingestPiece.postRollDuration
      && piece.transitionType !== ingestPiece.transitionType
      && JSON.stringify(piece.getTimelineObjects()) !== JSON.stringify(ingestPiece.timelineObjects)
      && JSON.stringify(piece.metadata) !== JSON.stringify(ingestPiece.metadata)
      && JSON.stringify(piece.content) !== JSON.stringify(ingestPiece.content)
  }
}
