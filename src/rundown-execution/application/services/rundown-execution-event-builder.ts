import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'
import { Rundown } from '../../domain/entities/rundown'
import {
  PartCreatedEvent,
  PartDeletedEvent,
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent, PartUnsyncedEvent, PartUpdatedEvent,
  PieceInsertedEvent,
  PieceReplacedEvent,
  PieceStoppedEvent,
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
  SegmentUpdatedEvent
} from '../value-objects/rundown-event'
import { RundownEventType } from '../enums/rundown-event-type'
import { PieceDto } from '../dtos/piece-dto'
import { Part } from '../../domain/entities/part'
import { PartDto } from '../dtos/part-dto'
import { Piece } from '../../domain/entities/piece'
import { RundownDto } from '../dtos/rundown-dto'
import { BasicRundownDto } from '../dtos/basic-rundown-dto'
import { Segment } from '../../domain/entities/segment'
import { SegmentDto } from '../dtos/segment-dto'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'
import { VideoMixerConfigurationUpdatedEvent } from '../value-objects/device-event'
import { DeviceEventType } from '../enums/device-event-type'
import { ShelfConfiguration } from '../../domain/entities/shelf-configuration'
import { ShelfConfigurationUpdatedEvent } from '../value-objects/configuration-event'
import { ConfigurationEventType } from '../enums/configuration-event-type'
import { ConfigurationEventBuilder } from '../interfaces/configuration-event-builder'
import { PlayoutContentEventBuilder } from '../interfaces/playout-content-event-builder'
import { PlayoutContent } from '../../domain/value-objects/playout-content'
import { PreviewPlayoutContentEvent, ProgramPlayoutContentEvent } from '../value-objects/playout-content-event'
import { PlayoutContentEventType } from '../enums/playout-content-event-type'

export class RundownExecutionEventBuilder implements RundownEventBuilder, DeviceEventBuilder, ConfigurationEventBuilder, PlayoutContentEventBuilder {
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

  public buildPieceStoppedEvent(rundown: Rundown, segmentId: string, piece: Piece): PieceStoppedEvent {
    return {
      type: RundownEventType.PIECE_STOPPED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId: piece.getPartId(),
      piece: new PieceDto(piece),
    }
  }

  public buildPieceReplacedEvent(rundown: Rundown, segmentId: string, replacedPieceId: string, newPiece: Piece): PieceReplacedEvent {
    return {
      type: RundownEventType.PIECE_REPLACED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId: newPiece.getPartId(),
      replacedPieceId: replacedPieceId,
      newPiece: new PieceDto(newPiece)
    }
  }

  public buildRundownCreatedEvent(rundown: Rundown): RundownCreatedEvent {
    return {
      type: RundownEventType.RUNDOWN_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      rundown: new RundownDto(rundown),
    }
  }

  public buildRundownUpdatedEvent(rundown: Rundown): RundownUpdatedEvent {
    return {
      type: RundownEventType.RUNDOWN_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      basicRundown: new BasicRundownDto(rundown),
    }
  }

  public buildRundownDeletedEvent(rundownId: string): RundownDeletedEvent {
    return {
      type: RundownEventType.RUNDOWN_DELETED,
      timestamp: Date.now(),
      rundownId: rundownId,
    }
  }

  public buildSegmentCreatedEvent(rundown: Rundown, segment: Segment): SegmentCreatedEvent {
    return {
      type: RundownEventType.SEGMENT_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: new SegmentDto(segment),
    }
  }

  public buildSegmentUpdatedEvent(rundown: Rundown, segment: Segment): SegmentUpdatedEvent {
    return {
      type: RundownEventType.SEGMENT_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segment: new SegmentDto(segment),
    }
  }

  public buildSegmentDeletedEvent(rundown: Rundown, segmentId: string): SegmentDeletedEvent {
    return {
      type: RundownEventType.SEGMENT_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
    }
  }

  public buildSegmentUnsyncedEvent(rundown: Rundown, unsyncedSegment: Segment, originalSegmentId: string): SegmentUnsyncedEvent {
    return {
      type: RundownEventType.SEGMENT_UNSYNCED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      unsyncedSegment: new SegmentDto(unsyncedSegment),
      originalSegmentId: originalSegmentId,
    }
  }

  public buildPartCreatedEvent(rundown: Rundown, part: Part): PartCreatedEvent {
    return {
      type: RundownEventType.PART_CREATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
    }
  }

  public buildPartUpdatedEvent(rundown: Rundown, part: Part): PartUpdatedEvent {
    return {
      type: RundownEventType.PART_UPDATED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(part),
    }
  }

  public buildPartDeletedEvent(rundown: Rundown, segmentId: string, partId: string): PartDeletedEvent {
    return {
      type: RundownEventType.PART_DELETED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      segmentId,
      partId,
    }
  }

  public buildPartUnsyncedEvent(rundown: Rundown, unsyncedPart: Part, originalPartId: string): PartUnsyncedEvent {
    return {
      type: RundownEventType.PART_UNSYNCED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      part: new PartDto(unsyncedPart),
      originalPartId,
    }
  }

  public buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration: VideoMixerConfiguration): VideoMixerConfigurationUpdatedEvent {
    return {
      type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED,
      videoMixer: videoMixerConfiguration,
      timestamp: Date.now()
    }
  }

  public buildShelfConfigurationUpdatedEvent(shelfConfiguration: ShelfConfiguration): ShelfConfigurationUpdatedEvent {
    return {
      type: ConfigurationEventType.SHELF_CONFIGURATION_UPDATED,
      timestamp: Date.now(),
      shelfConfiguration
    }
  }

  public buildProgramPlayoutContentEvent(playoutContents: PlayoutContent[]): ProgramPlayoutContentEvent {
    return {
      type: PlayoutContentEventType.PROGRAM_PLAYOUT_CONTENT,
      timestamp: Date.now(),
      playoutContents
    }
  }

  public buildPreviewPlayoutContentEvent(playoutContents: PlayoutContent[]): PreviewPlayoutContentEvent {
    return {
      type: PlayoutContentEventType.PREVIEW_PLAYOUT_CONTENT,
      timestamp: Date.now(),
      playoutContents
    }
  }
}
