import { PlayoutContentEventEmitter } from '../interfaces/playout-content-event-emitter'
import { PlayoutContent } from '../../domain/value-objects/playout-content'
import {
  PlayoutContentEvent,
  PreviewPlayoutContentEvent,
  ProgramPlayoutContentEvent
} from '../value-objects/playout-content-event'
import { PlayoutContentEventBuilder } from '../interfaces/playout-content-event-builder'
import { TypedEventEmitter } from '../../../cross-cutting-concerns/application/interfaces/typed-event-emitter'

export class PlayoutContentEventService implements PlayoutContentEventEmitter {
  public constructor(private readonly typedEventEmitter: TypedEventEmitter, private readonly playoutContentEventBuilder: PlayoutContentEventBuilder) {
  }

  private emitPlayoutContentEvent(playoutContentEvent: PlayoutContentEvent): void {
    this.typedEventEmitter.emitTypedEvent(playoutContentEvent)
  }

  public emitProgramPlayoutContentEvent(programPlayoutContents: PlayoutContent[]): void {
    const event: ProgramPlayoutContentEvent = this.playoutContentEventBuilder.buildProgramPlayoutContentEvent(programPlayoutContents)
    this.emitPlayoutContentEvent(event)
  }

  public emitPreviewPlayoutContentEvent(previewPlayoutContents: PlayoutContent[]): void {
    const event: PreviewPlayoutContentEvent = this.playoutContentEventBuilder.buildPreviewPlayoutContentEvent(previewPlayoutContents)
    this.emitPlayoutContentEvent(event)
  }
}
