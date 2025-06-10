import { TypedEvent } from './typed-event'
import { PlayoutContentEventType } from '../enums/event-type'
import { PlayoutContent } from '../../rundown-execution/domain/value-objects/playout-content'

export type PlayoutContentEvent = ProgramPlayoutContentEvent | PreviewPlayoutContentEvent

export interface ProgramPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PROGRAM_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}

export interface PreviewPlayoutContentEvent extends TypedEvent {
  type: PlayoutContentEventType.PREVIEW_PLAYOUT_CONTENT
  playoutContents: PlayoutContent[]
}
