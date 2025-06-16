import { TypedEvent } from '../../../cross-cutting-concerns/application/value-objects/typed-event'
import { PlayoutContentEventType } from '../../../leftovers/event-type'
import { PlayoutContent } from '../../domain/value-objects/playout-content'

export type PlayoutContentEvent = ProgramPlayoutContentEvent | PreviewPlayoutContentEvent

export interface ProgramPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PROGRAM_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}

export interface PreviewPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PREVIEW_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}
