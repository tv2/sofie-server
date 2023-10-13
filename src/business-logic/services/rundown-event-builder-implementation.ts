import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { Rundown } from '../../model/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartEventInterface,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUpdatedEvent,
  PieceEventInterface,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownCreatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
  RundownUpdatedEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentEventInterface,
  SegmentUpdatedEvent,
} from '../../model/value-objects/rundown-event'
import { IngestEventType, RundownEventType } from '../../model/enums/event-type'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { Segment } from '../../model/entities/segment'

export class RundownEventBuilderImplementation implements RundownEventBuilder {

  public buildActivateEvent(rundown: Rundown): RundownActivatedEvent {
    return {
      type: RundownEventType.ACTIVATED,
      timestamp: Date.now(),
      rundownId: rundown.id
    }
  }

  public buildDeactivateEvent(rundown: Rundown): RundownDeactivatedEvent {
    return {
      type: RundownEventType.DEACTIVATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
    }
  }

  public buildResetEvent(rundown: Rundown): RundownResetEvent {
    return {
      type: RundownEventType.RESET,
      timestamp: Date.now(),
      rundownId: rundown.id,
    }
  }

  public buildTakeEvent(rundown: Rundown): PartTakenEvent {
    return {
      type: RundownEventType.TAKEN,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: rundown.getActiveSegment().id,
      partId: rundown.getActivePart().id,
    }
  }

  public buildSetNextEvent(rundown: Rundown): PartSetAsNextEvent {
    return {
      type: RundownEventType.SET_NEXT,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: rundown.getNextSegment().id,
      partId: rundown.getNextPart().id,
    }
  }

  public buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): RundownInfinitePieceAddedEvent {
    return {
      type: RundownEventType.INFINITE_PIECE_ADDED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      infinitePiece,
    }
  }

  public buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_ON_AIR,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: this.convertPartToEvent(part)
    }
  }

  private convertPartToEvent(part: Part): PartEventInterface {
    return {
      id: part.id,
      segmentId: part.getSegmentId(),
      name: part.name,
      isPlanned: false,
      isPartOnAir: true,
      isPartNext: false,
      executedAt: part.getExecutedAt(),
      expectedDuration: part.expectedDuration,
      playedDuration: part.getPlayedDuration(),
      autoNext: part.autoNext,
      pieces: part.getPieces().map(piece => this.convertPieceToEvent(piece))
    }
  }

  private convertPieceToEvent(piece: Piece): PieceEventInterface {
    return {
      id: piece.id,
      partId: piece.id,
      name: piece.name,
      isPlanned: false,
      layer: piece.layer,
      type: piece.type,
      start: piece.getStart(),
      duration: piece.duration
    }
  }

  public buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_NEXT,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: this.convertPartToEvent(part)
    }
  }

  public buildPieceInsertedEvent(rundown: Rundown, piece: Piece): PieceInsertedEvent {
    return {
      type: RundownEventType.PIECE_INSERTED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      piece: this.convertPieceToEvent(piece)
    }
  }

  public buildRundownCreatedEvent(rundown: Rundown): RundownCreatedEvent {
    return {
      type: IngestEventType.RUNDOWN_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id
    }
  }

  public buildRundownUpdatedEvent(rundown: Rundown): RundownUpdatedEvent {
    return {
      type: IngestEventType.RUNDOWN_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id
    }
  }

  public buildRundownDeletedEvent(rundownId: string): RundownDeletedEvent {
    return {
      type: IngestEventType.RUNDOWN_DELETED,
      timestamp: Date.now(),
      rundownId: rundownId,
    }
  }

  public buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent {
    return {
      type: IngestEventType.SEGMENT_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: this.convertSegmentToEvent(segment)
    }
  }

  private convertSegmentToEvent(segment: Segment): SegmentEventInterface {
    return {
      id: segment.id,
      rundownId: segment.rundownId,
      name: segment.name,
      rank: segment.rank,
      isOnAir: segment.isOnAir(),
      isNext: segment.isNext(),
      budgetDuration: segment.budgetDuration,
      parts: segment.getParts().map(part => this.convertPartToEvent(part))
    }
  }

  public buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent {
    return {
      type: IngestEventType.SEGMENT_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: this.convertSegmentToEvent(segment)
    }
  }

  public buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent {
    return {
      type: IngestEventType.SEGMENT_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId
    }
  }

  public buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent {
    return {
      type: IngestEventType.PART_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: this.convertPartToEvent(part)
    }
  }

  public buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent {
    return {
      type: IngestEventType.PART_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: this.convertPartToEvent(part)
    }
  }

  public buildPartDeletedEvent(rundown: Rundown, partId: string): PartDeletedEvent {
    return {
      type: IngestEventType.PART_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      partId
    }
  }
}
