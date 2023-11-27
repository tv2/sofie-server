import { IngestedPiece } from '../../model/entities/ingested-piece'
import { Piece } from '../../model/entities/piece'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Part } from '../../model/entities/part'
import { PartTimings } from '../../model/value-objects/part-timings'
import { Exception } from '../../model/exceptions/exception'
import { ErrorCode } from '../../model/enums/error-code'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Segment } from '../../model/entities/segment'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Rundown, RundownAlreadyActiveProperties } from '../../model/entities/rundown'

export class IngestedEntityToEntityMapper {

  constructor() { }

  public fromIngestedRundown(ingestedRundown: IngestedRundown): Rundown {
    return new Rundown({
      id: ingestedRundown.id,
      name: ingestedRundown.name,
      showStyleVariantId: ingestedRundown.showStyleVariantId,
      segments: [],
      history: [],
      isRundownActive: false,
      modifiedAt: ingestedRundown.modifiedAt,
      baselineTimelineObjects: ingestedRundown.baselineTimelineObjects,
      timing: ingestedRundown.timings
    })
  }

  public updateRundownFromIngestedRundown(rundownToUpdate: Rundown, ingestedRundown: IngestedRundown): Rundown {
    const alreadyActiveProperties: RundownAlreadyActiveProperties | undefined = rundownToUpdate.isActive()
      ? {
        activeCursor: rundownToUpdate.getActiveCursor(),
        nextCursor: rundownToUpdate.getNextCursor(),
        infinitePieces: rundownToUpdate.getInfinitePiecesMap()
      }
      : undefined

    return new Rundown({
      id: rundownToUpdate.id,
      name: ingestedRundown.name,
      isRundownActive: rundownToUpdate.isActive(),
      showStyleVariantId: ingestedRundown.showStyleVariantId,
      baselineTimelineObjects: ingestedRundown.baselineTimelineObjects,
      history: rundownToUpdate.getHistory(),
      modifiedAt: ingestedRundown.modifiedAt,
      timing: ingestedRundown.timings,
      persistentState: rundownToUpdate.getPersistentState(),
      segments: rundownToUpdate.getSegments(),
      alreadyActiveProperties: alreadyActiveProperties
    })
  }

  public fromIngestedSegment(ingestedSegment: IngestedSegment): Segment {
    return new Segment({
      id: ingestedSegment.id,
      rundownId: ingestedSegment.rundownId,
      name: ingestedSegment.name,
      rank: ingestedSegment.rank,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      budgetDuration: ingestedSegment.budgetDuration,
      parts: [],
    })
  }

  public updateSegmentWithIngestedSegment(segmentToBeUpdated: Segment, ingestedSegment: IngestedSegment): Segment {
    return new Segment({
      id: segmentToBeUpdated.id,
      rundownId: segmentToBeUpdated.rundownId,
      name: ingestedSegment.name,
      rank: ingestedSegment.rank,
      isOnAir: segmentToBeUpdated.isOnAir(),
      isNext: segmentToBeUpdated.isNext(),
      isUnsynced: false, // Updated are never unsynced since Core removes and adds new Segments instead of updating them
      budgetDuration: ingestedSegment.budgetDuration,
      parts: segmentToBeUpdated.getParts(),
    })
  }


  public fromIngestedPart(ingestedPart: IngestedPart): Part {
    return new Part({
      id: ingestedPart.id,
      rundownId: ingestedPart.rundownId,
      segmentId: ingestedPart.segmentId,
      name: ingestedPart.name,
      rank: ingestedPart.rank,
      isPlanned: true,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      isUntimed: ingestedPart.isUntimed,
      pieces: ingestedPart.ingestedPieces.map((ingestedPiece: IngestedPiece) => this.fromIngestedPiece(ingestedPiece)),
      expectedDuration: ingestedPart.expectedDuration,
      inTransition: ingestedPart.inTransition,
      outTransition: ingestedPart.outTransition,
      autoNext: ingestedPart.autoNext,
      disableNextInTransition: ingestedPart.disableNextInTransition,
      defaultPart: ingestedPart
    })
  }

  public updatePartWithIngestedPart(partToBeUpdated: Part, ingestedPart: IngestedPart): Part {
    const updatedPieces: Piece[] = partToBeUpdated.getPieces()
      .map(piece => {
        const ingestedPiece: IngestedPiece | undefined = ingestedPart.ingestedPieces.find(ingestedPiece => ingestedPiece.id === piece.id)
        if (!ingestedPiece) {
          return piece
        }
        return this.updatePieceWithIngestedPiece(piece, ingestedPiece)
      })

    return new Part({
      id: partToBeUpdated.id,
      rundownId: ingestedPart.rundownId,
      segmentId: partToBeUpdated.getSegmentId(),
      name: ingestedPart.name,
      rank: ingestedPart.rank,
      isPlanned: partToBeUpdated.isPlanned,
      isOnAir: partToBeUpdated.isOnAir(),
      isNext: false, // The Rundown always updates its own NextCursor, so we don't need to remember that value
      isUnsynced: false, // Updated are never unsynced since Core removes and adds new Parts instead of updating them
      isUntimed: ingestedPart.isUntimed,
      pieces: updatedPieces,
      expectedDuration: ingestedPart.expectedDuration,
      inTransition: ingestedPart.inTransition,
      outTransition: ingestedPart.outTransition,
      autoNext: ingestedPart.autoNext,
      disableNextInTransition: ingestedPart.disableNextInTransition,
      executedAt: partToBeUpdated.getExecutedAt(),
      playedDuration: partToBeUpdated.getPlayedDuration(),
      endState: partToBeUpdated.getEndState(),
      timings: this.getPartTimings(partToBeUpdated),
      defaultPart: ingestedPart
    })
  }

  private getPartTimings(part: Part): PartTimings | undefined {
    try {
      return  part.getTimings()
    } catch (error) {
      if ((error as Exception).errorCode !== ErrorCode.UNSUPPORTED_OPERATION) {
        throw error
      }
    }
  }

  public fromIngestedPiece(ingestedPiece: IngestedPiece): Piece {
    return new Piece({
      id: ingestedPiece.id,
      partId: ingestedPiece.partId,
      name: ingestedPiece.name,
      layer: ingestedPiece.layer,
      pieceLifespan: ingestedPiece.pieceLifespan,
      isPlanned: true,
      start: ingestedPiece.start,
      duration: ingestedPiece.duration,
      preRollDuration: ingestedPiece.preRollDuration,
      postRollDuration: ingestedPiece.postRollDuration,
      transitionType: ingestedPiece.transitionType,
      timelineObjects: ingestedPiece.timelineObjects,
      metadata: ingestedPiece.metadata,
      content: ingestedPiece.content,
      tags: [],
      isUnsynced: false
    })
  }

  private updatePieceWithIngestedPiece(pieceToBeUpdated: Piece, ingestedPiece: IngestedPiece): Piece {
    return new Piece({
      id: pieceToBeUpdated.id,
      partId: pieceToBeUpdated.getPartId(),
      name: ingestedPiece.name,
      layer: ingestedPiece.layer,
      pieceLifespan: ingestedPiece.pieceLifespan,
      isPlanned: pieceToBeUpdated.isPlanned,
      start: ingestedPiece.start,
      duration: ingestedPiece.duration,
      preRollDuration: ingestedPiece.preRollDuration,
      postRollDuration: ingestedPiece.postRollDuration,
      transitionType: ingestedPiece.transitionType,
      timelineObjects: ingestedPiece.timelineObjects,
      metadata: ingestedPiece.metadata,
      content: ingestedPiece.content,
      tags: pieceToBeUpdated.tags,
      isUnsynced: pieceToBeUpdated.isUnsynced(),
      executedAt: pieceToBeUpdated.getExecutedAt()
    })
  }
}
