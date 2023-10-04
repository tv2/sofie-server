import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { Rundown } from '../../model/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUpdatedEvent,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
  SegmentCreatedEvent,
  SegmentDeletedEvent,
  SegmentUpdatedEvent,
} from '../../model/value-objects/rundown-event'
import { IngestEventType, RundownEventType } from '../../model/enums/event-type'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { Segment } from '../../model/entities/segment'

export class RundownEventBuilderImplementation implements RundownEventBuilder {
  public buildDeletedEvent(rundown: Rundown): RundownDeletedEvent {
    return {
      type: RundownEventType.DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
    }
  }

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
      part: {
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
        pieces: part.getPieces().map(piece => {
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
        })
      }
    }
  }

  public buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_NEXT,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: {
        id: part.id,
        segmentId: part.getSegmentId(),
        name: part.name,
        isPlanned: false,
        isPartOnAir: false,
        isPartNext: true,
        executedAt: part.getExecutedAt(),
        expectedDuration: part.expectedDuration,
        playedDuration: part.getPlayedDuration(),
        autoNext: part.autoNext,
        pieces: part.getPieces().map(piece => {
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
        })
      }
    }

  }

  public buildPieceInsertedEvent(rundown: Rundown, piece: Piece): PieceInsertedEvent {
    return {
      type: RundownEventType.PIECE_INSERTED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      piece: {
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
  }

  public buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent {
    return {
      type: IngestEventType.SEGMENT_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: segment.id // TODO: Should this emit the entire new Segment, or should the clients fetch them themselves?
    }
  }

  public buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent {
    return {
      type: IngestEventType.SEGMENT_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: segment.id
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
      segmentId: part.getSegmentId(),
      partId: part.id
    }
  }

  public buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent {
    return {
      type: IngestEventType.PART_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: part.getSegmentId(),
      partId: part.id
    }
  }

  public buildPartDeletedEvent(rundown: Rundown, partId: string): PartDeletedEvent {
    return {
      type: IngestEventType.PART_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId: '',
      partId: partId
    }
  }
}
