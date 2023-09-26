import { Rundown } from '../../../model/entities/rundown'
import {
  RundownAdLibPieceInsertedEvent,
  RundownInfinitePieceAddedEvent,
  RundownActivatedEvent,
  RundownDeactivatedEvent,
  RundownResetEvent,
  PartTakenEvent,
  PartSetAsNextEvent,
  RundownDeletedEvent, PartInsertedAsOnAirEvent, PartInsertedAsNextEvent, PieceInsertedEvent,
} from '../../../model/value-objects/rundown-event'
import { AdLibPiece } from '../../../model/entities/ad-lib-piece'
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
  buildAdLibPieceInsertedEvent(rundown: Rundown, adLibPiece: AdLibPiece): RundownAdLibPieceInsertedEvent
  buildInfiniteRundownPieceAddedEvent(rundown: Rundown, infinitePiece: Piece): RundownInfinitePieceAddedEvent
}
