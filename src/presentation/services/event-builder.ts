import {RundownEventBuilder} from '../interfaces/rundown-event-builder'
import {Rundown} from '../../model/entities/rundown'
import {
  AutoNextStartedEvent,
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PartUnsyncedEvent,
  PartUpdatedEvent,
  PieceInsertedEvent,
  PieceReplacedEvent,
  RundownActivatedEvent,
  RundownCreatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePiecesUpdatedEvent,
  RundownRehearseEvent,
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
import {
  ActionTriggerEventType,
  ConfigurationEventType,
  IngestEventType,
  RundownEventType,
  StatusMessageEventType
} from '../enums/event-type'
import {SegmentDto} from '../dtos/segment-dto'
import {Segment} from '../../model/entities/segment'
import {BasicRundownDto} from '../dtos/basic-rundown-dto'
import {ActionTriggerEventBuilder} from '../interfaces/action-trigger-event-builder'
import {ActionTrigger} from '../../model/entities/action-trigger'
import {
  ActionTriggerCreatedEvent,
  ActionTriggerDeletedEvent,
  ActionTriggerUpdatedEvent
} from '../value-objects/action-trigger-event'
import {ActionTriggerDto} from '../dtos/action-trigger-dto'
import {RundownDto} from '../dtos/rundown-dto'
import {Media} from '../../model/entities/media'
import {MediaDto} from '../dtos/media-dto'
import {MediaEventBuilder} from '../interfaces/media-event-builder'
import {MediaCreatedEvent, MediaDeletedEvent, MediaUpdatedEvent} from '../value-objects/media-event'
import {ConfigurationEventBuilder} from '../interfaces/configuration-event-builder'
import {ShelfConfiguration} from '../../model/entities/shelf-configuration'
import {ShelfConfigurationUpdatedEvent} from '../value-objects/configuration-event'
import {StatusMessageEventBuilder} from '../interfaces/status-message-event-builder'
import {StatusMessage} from '../../model/entities/status-message'
import {StatusMessageEvent} from '../value-objects/status-message-event'

export class EventBuilder implements RundownEventBuilder, ActionTriggerEventBuilder, MediaEventBuilder, ConfigurationEventBuilder, StatusMessageEventBuilder {
  public buildActivateEvent(rundown: Rundown): RundownActivatedEvent {
    return {
      type: RundownEventType.ACTIVATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
    }
  }

  public buildRehearseEvent(rundown: Rundown): RundownRehearseEvent {
    return {
      type: RundownEventType.REHEARSE,
      timestamp: Date.now(),
      rundownId: rundown.id,
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

  public buildInfinitePiecesUpdatedEvent(rundown: Rundown): RundownInfinitePiecesUpdatedEvent {
    return {
      type: RundownEventType.INFINITE_PIECES_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      infinitePieces: rundown.getInfinitePieces().map(piece => new PieceDto(piece)),
    }
  }

  public buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_ON_AIR,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
    }
  }

  public buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent {
    return {
      type: RundownEventType.PART_INSERTED_AS_NEXT,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
    }
  }

  public buildPieceInsertedEvent(rundown: Rundown, segmentId: string, piece: Piece): PieceInsertedEvent {
    return {
      type: RundownEventType.PIECE_INSERTED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId: piece.getPartId(),
      piece: new PieceDto(piece),
    }
  }

  public buildPieceReplacedEvent(rundown: Rundown, segmentId: string, replacedPiece: Piece, newPiece: Piece): PieceReplacedEvent {
    return {
      type: RundownEventType.PIECE_REPLACED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId: newPiece.getPartId(),
      replacedPiece: new PieceDto(replacedPiece),
      newPiece: new PieceDto(newPiece)
    }
  }

  public buildAutoNextStartedEvent(rundownId: string): AutoNextStartedEvent {
    return {
      type: RundownEventType.AUTO_NEXT_STARTED,
      timestamp: Date.now(),
      rundownId: rundownId,
    }
  }

  public buildRundownCreatedEvent(rundown: Rundown): RundownCreatedEvent {
    return {
      type: IngestEventType.RUNDOWN_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      rundown: new RundownDto(rundown),
    }
  }

  public buildRundownUpdatedEvent(rundown: Rundown): RundownUpdatedEvent {
    return {
      type: IngestEventType.RUNDOWN_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      basicRundown: new BasicRundownDto(rundown),
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
      segment: new SegmentDto(segment),
    }
  }

  public buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent {
    return {
      type: IngestEventType.SEGMENT_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: new SegmentDto(segment),
    }
  }

  public buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent {
    return {
      type: IngestEventType.SEGMENT_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
    }
  }

  public buildSegmentUnsyncedEvent(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): SegmentUnsyncedEvent {
    return {
      type: IngestEventType.SEGMENT_UNSYNCED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      unsyncedSegment: new SegmentDto(unsyncedSegment),
      originalSegmentId: originalSegmentId,
    }
  }

  public buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent {
    return {
      type: IngestEventType.PART_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
    }
  }

  public buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent {
    return {
      type: IngestEventType.PART_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
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
      part: new PartDto(part),
    }
  }

  public buildMediaCreatedEvent(media: Media): MediaCreatedEvent {
    return {
      type: IngestEventType.MEDIA_CREATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaUpdatedEvent(media: Media): MediaUpdatedEvent {
    return {
      type: IngestEventType.MEDIA_UPDATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaDeletedEvent(mediaId: string): MediaDeletedEvent {
    return {
      type: IngestEventType.MEDIA_DELETED,
      timestamp: Date.now(),
      mediaId: mediaId,
    }
  }

  public buildActionTriggerCreatedEvent(actionTrigger: ActionTrigger): ActionTriggerCreatedEvent {
    return {
      type: ActionTriggerEventType.ACTION_TRIGGER_CREATED,
      timestamp: Date.now(),
      actionTrigger: new ActionTriggerDto(actionTrigger),
    }
  }

  public buildActionTriggerUpdatedEvent(actionTrigger: ActionTrigger): ActionTriggerUpdatedEvent {
    return {
      type: ActionTriggerEventType.ACTION_TRIGGER_UPDATED,
      timestamp: Date.now(),
      actionTrigger: new ActionTriggerDto(actionTrigger),
    }
  }

  public buildActionTriggerDeletedEvent(actionTriggerId: string): ActionTriggerDeletedEvent {
    return {
      type: ActionTriggerEventType.ACTION_TRIGGER_DELETED,
      timestamp: Date.now(),
      actionTriggerId,
    }
  }

  public buildShelfConfigurationUpdatedEvent(shelfConfiguration: ShelfConfiguration): ShelfConfigurationUpdatedEvent {
    return {
      type: ConfigurationEventType.SHELF_CONFIGURATION_UPDATED,
      timestamp: Date.now(),
      shelfConfiguration
    }
  }

  public buildStatusMessageEvent(statusMessage: StatusMessage): StatusMessageEvent {
    return {
      type: StatusMessageEventType.STATUS_MESSAGE,
      timestamp: Date.now(),
      statusMessage
    }
  }
}
