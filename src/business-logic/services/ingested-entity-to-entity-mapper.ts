import { IngestedPiece } from '../../model/entities/ingested-piece'
import { Piece } from '../../model/entities/piece'
import { IngestedPart } from '../../model/entities/ingested-part'
import { Part } from '../../model/entities/part'
import { PartTimings } from '../../model/value-objects/part-timings'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { Segment } from '../../model/entities/segment'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { Rundown, RundownAlreadyActiveProperties } from '../../model/entities/rundown'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { RundownMode } from '../../model/enums/rundown-mode'

export class IngestedEntityToEntityMapper {

  public convertIngestedRundownToRundown(ingestedRundown: IngestedRundown): Rundown {
    return new Rundown({
      id: ingestedRundown.id,
      name: ingestedRundown.name,
      showStyleVariantId: ingestedRundown.showStyleVariantId,
      segments: [],
      history: [],
      mode: RundownMode.INACTIVE,
      modifiedAt: ingestedRundown.modifiedAt,
      baselineTimelineObjects: ingestedRundown.baselineTimelineObjects,
      timing: ingestedRundown.timings
    })
  }

  public updateRundownFromIngestedRundown(rundownToUpdate: Rundown, ingestedRundown: IngestedRundown): Rundown {
    const alreadyActiveProperties: RundownAlreadyActiveProperties | undefined = rundownToUpdate.isActive() || rundownToUpdate.isRehearsal()
      ? {
        activeCursor: rundownToUpdate.getActiveCursor(),
        nextCursor: rundownToUpdate.getNextCursor(),
        infinitePieces: rundownToUpdate.getInfinitePiecesMap()
      }
      : undefined

    return new Rundown({
      ...ingestedRundown,
      id: rundownToUpdate.id,
      mode: rundownToUpdate.getMode(),
      history: rundownToUpdate.getHistory(),
      timing: ingestedRundown.timings,
      persistentState: rundownToUpdate.getPersistentState(),
      segments: rundownToUpdate.getSegments(),
      alreadyActiveProperties
    })
  }

  public convertIngestedSegmentToSegment(ingestedSegment: IngestedSegment): Segment {
    return new Segment({
      id: ingestedSegment.id,
      rundownId: ingestedSegment.rundownId,
      name: ingestedSegment.name,
      rank: ingestedSegment.rank,
      isHidden: ingestedSegment.isHidden,
      referenceTag: ingestedSegment.referenceTag,
      metadata: ingestedSegment.metadata,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      expectedDurationInMs: ingestedSegment.budgetDuration,
      parts: [],
    })
  }

  public updateSegmentWithIngestedSegment(segmentToBeUpdated: Segment, ingestedSegment: IngestedSegment): Segment {
    return new Segment({
      ...ingestedSegment,
      id: segmentToBeUpdated.id,
      isOnAir: segmentToBeUpdated.isOnAir(),
      isNext: segmentToBeUpdated.isNext(),
      isUnsynced: false, // Updated are never unsynced since Core removes and adds new Segments instead of updating them
      expectedDurationInMs: ingestedSegment.budgetDuration,
      executedAtEpochTime: segmentToBeUpdated.getExecutedAtEpochTime(),
      parts: segmentToBeUpdated.getParts().map(part => {
        const ingestedPart: IngestedPart | undefined = ingestedSegment.ingestedParts.find(ingestedPart => ingestedPart.id === part.id)
        if (!ingestedPart) {
          return part
        }
        return this.updatePartWithIngestedPart(part, ingestedPart)
      }),
    })
  }


  public convertIngestedPartToPart(ingestedPart: IngestedPart): Part {
    return new Part({
      id: ingestedPart.id,
      rundownId: ingestedPart.rundownId,
      segmentId: ingestedPart.segmentId,
      name: ingestedPart.name,
      rank: ingestedPart.rank,
      isOnAir: false,
      isNext: false,
      isUnsynced: false,
      isUntimed: ingestedPart.isUntimed,
      pieces: ingestedPart.ingestedPieces.map((ingestedPiece: IngestedPiece) => this.convertIngestedPieceToPiece(ingestedPiece)),
      expectedDuration: ingestedPart.expectedDuration,
      invalidity: ingestedPart.invalidity,
      inTransition: ingestedPart.inTransition,
      outTransition: ingestedPart.outTransition,
      autoNext: ingestedPart.autoNext,
      disableNextInTransition: ingestedPart.disableNextInTransition,
      ingestedPart
    })
  }

  public updatePartWithIngestedPart(partToBeUpdated: Part, ingestedPart: IngestedPart): Part {
    const updatedPieces: Piece[] = ingestedPart.ingestedPieces.map(ingestedPiece => {
      const existingPiece: Piece | undefined = partToBeUpdated.getPieces().find(piece => piece.id === ingestedPiece.id)
      return existingPiece
        ? this.updatePieceWithIngestedPiece(existingPiece, ingestedPiece)
        : this.convertIngestedPieceToPiece(ingestedPiece)
    })

    return new Part({
      ...ingestedPart,
      id: partToBeUpdated.id,
      segmentId: partToBeUpdated.getSegmentId(),
      name: ingestedPart.name,
      rank: ingestedPart.rank,
      isOnAir: partToBeUpdated.isOnAir(),
      isNext: false, // The Rundown always updates its own NextCursor, so we don't need to remember that value
      isUnsynced: false, // Updated are never unsynced since Core removes and adds new Parts instead of updating them
      pieces: updatedPieces,
      executedAt: partToBeUpdated.getExecutedAt(),
      playedDuration: partToBeUpdated.getPlayedDuration(),
      endState: partToBeUpdated.getEndState(),
      timings: this.getPartTimings(partToBeUpdated),
      ingestedPart
    })
  }

  private getPartTimings(part: Part): PartTimings | undefined {
    try {
      return part.getTimings()
    } catch (error) {
      if (!(error instanceof UnsupportedOperationException)) {
        throw error
      }
    }
  }

  private convertIngestedPieceToPiece(ingestedPiece: IngestedPiece): Piece {
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
