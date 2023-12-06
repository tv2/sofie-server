import {RundownEventBuilder} from '../interfaces/rundown-event-builder'
import {Rundown} from '../../model/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUnsyncedEvent,
  PartUpdatedEvent,
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
  SegmentUnsyncedEvent,
  SegmentUpdatedEvent,
} from '../value-objects/rundown-event'
import {Piece} from '../../model/entities/piece'
import {Part} from '../../model/entities/part'
import {PartDto} from '../dtos/part-dto'
import {PieceDto} from '../dtos/piece-dto'
import {IngestEventType, RundownEventType} from '../enums/rundown-event-type'
import {SegmentDto} from '../dtos/segment-dto'
import {Segment} from '../../model/entities/segment'
import {BasicRundownDto} from '../dtos/basic-rundown-dto'

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
      infinitePiece: new PieceDto(infinitePiece),
    }
  }

  public buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_ON_AIR,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part)
    }
  }

  public buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_NEXT,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part)
    }
  }

  public buildPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): PieceInsertedEvent {
    return {
      type: RundownEventType.PIECE_INSERTED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId: piece.getPartId(),
      piece: new PieceDto(piece)
    }
  }

  public buildRundownCreatedEvent(rundown: Rundown): RundownCreatedEvent {
    return {
      type: IngestEventType.RUNDOWN_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      basicRundown: new BasicRundownDto(rundown)
    }
  }

  public buildRundownUpdatedEvent(rundown: Rundown): RundownUpdatedEvent {
    return {
      type: IngestEventType.RUNDOWN_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      basicRundown: new BasicRundownDto(rundown)
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
      segment: new SegmentDto(segment)
    }
  }

  public buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent {
    return {
      type: IngestEventType.SEGMENT_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: new SegmentDto(segment)
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

  public buildSegmentUnsyncedEvent(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): SegmentUnsyncedEvent {
    return {
      type: IngestEventType.SEGMENT_UNSYNCED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      unsyncedSegment: new SegmentDto(unsyncedSegment),
      originalSegmentId: originalSegmentId
    }
  }

  public buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent {
    return {
      type: IngestEventType.PART_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part)
    }
  }

  public buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent {
    return {
      type: IngestEventType.PART_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part)
    }
  }

  public buildPartDeletedEvent(rundown: Rundown, segmentId: string, partId: string): PartDeletedEvent {
    return {
      type: IngestEventType.PART_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId,
    }
  }

  public buildPartUnsyncedEvent(rundown: Rundown, part: Part): PartUnsyncedEvent {
    return {
      type: IngestEventType.PART_UNSYNCED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part)
    }
  }
}
