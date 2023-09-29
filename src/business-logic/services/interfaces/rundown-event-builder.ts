import { Rundown } from '../../../model/entities/rundown'
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
} from '../../../model/value-objects/rundown-event'
import { Piece } from '../../../model/entities/piece'
import { Part } from '../../../model/entities/part'

export interface RundownEventBuilder {
  buildActivateEvent(rundown: Rundown): RundownActivatedEvent
  buildDeactivateEvent(rundown: Rundown): RundownDeactivatedEvent
  buildResetEvent(rundown: Rundown): RundownResetEvent
  buildTakeEvent(rundown: Rundown): PartTakenEvent
  buildSetNextEvent(rundown: Rundown): PartSetAsNextEvent
  buildDeletedEvent(rundown: Rundown): RundownDeletedEvent
  buildPartInsertedAsOnAirEvent(rundown: Rundown, part: Part): PartInsertedAsOnAirEvent
  buildPartInsertedAsNextEvent(rundown: Rundown, part: Part): PartInsertedAsNextEvent
  buildPieceInsertedEvent(rundown: Rundown, piece: Piece): PieceInsertedEvent
  buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): RundownInfinitePieceAddedEvent
}
