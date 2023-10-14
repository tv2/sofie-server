import { RundownEventBuilder } from '../interfaces/rundown-event-builder'
import { Rundown } from '../../model/entities/rundown'
import {
  PartInsertedAsNextEvent,
  PartInsertedAsOnAirEvent,
  PartSetAsNextEvent,
  PartTakenEvent,
  PieceInsertedEvent,
  RundownActivatedEvent,
  RundownDeactivatedEvent,
  RundownDeletedEvent,
  RundownInfinitePieceAddedEvent,
  RundownResetEvent,
} from '../value-objects/rundown-event'
import { RundownEventType } from '../enums/rundown-event-type'
import { Piece } from '../../model/entities/piece'
import { Part } from '../../model/entities/part'
import { PartDto } from '../dtos/part-dto'
import { PieceDto } from '../dtos/piece-dto'

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

  public buildPieceInsertedEvent(rundown: Rundown, piece: Piece): PieceInsertedEvent {
    return {
      type: RundownEventType.PIECE_INSERTED,
      timestamp: Date.now(),
      rundownId: rundown.id,
      piece: new PieceDto(piece)
    }
  }
}
