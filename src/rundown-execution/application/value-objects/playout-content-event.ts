import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { PlayoutContent } from '../../domain/value-objects/playout-content'
import { PlayoutContentEventType } from '../enums/playout-content-event-type'

export type PlayoutContentEvent = ProgramPlayoutContentEvent | PreviewPlayoutContentEvent

export interface ProgramPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PROGRAM_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}

export interface PreviewPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PREVIEW_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}
