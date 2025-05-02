import { PlayoutContentEventEmitter } from '../../business-logic/services/interfaces/playout-content-event-emitter'
import { PlayoutContentEventObserver } from '../interfaces/playout-content-event-observer'
import { PlayoutContent } from '../../model/value-objects/playout-content'
import {
  PlayoutContentEvent,
  PreviewPlayoutContentEvent,
  ProgramPlayoutContentEvent
} from '../value-objects/playout-content-event'
import { PlayoutContentEventBuilder } from '../interfaces/playout-content-event-builder'

export class PlayoutContentEventService implements PlayoutContentEventEmitter, PlayoutContentEventObserver {
  private static instance: PlayoutContentEventService

  public static getInstance(playoutContentEventBuilder: PlayoutContentEventBuilder): PlayoutContentEventService {
    if (!this.instance) {
      this.instance = new PlayoutContentEventService(playoutContentEventBuilder)
    }
    return this.instance
  }

  private readonly callbacks: ((playoutContentEvent: PlayoutContentEvent) => void)[] = []

  protected constructor(private readonly playoutContentEventBuilder: PlayoutContentEventBuilder) {
  }

  private emitPlayoutContentEvent(playoutContentEvent: PlayoutContentEvent): void {
    this.callbacks.forEach(callback => callback(playoutContentEvent))
  }

  public emitProgramPlayoutContentEvent(programPlayoutContents: PlayoutContent[]): void {
    const event: ProgramPlayoutContentEvent = this.playoutContentEventBuilder.buildProgramPlayoutContentEvent(programPlayoutContents)
    this.emitPlayoutContentEvent(event)
  }

  public emitPreviewPlayoutContentEvent(previewPlayoutContents: PlayoutContent[]): void {
    const event: PreviewPlayoutContentEvent = this.playoutContentEventBuilder.buildPreviewPlayoutContentEvent(previewPlayoutContents)
    this.emitPlayoutContentEvent(event)
  }

  public subscribeToPlayoutContentEvents(onPlayoutContentEventCallback: (playoutContentEvent: PlayoutContentEvent) => void): void {
    this.callbacks.push(onPlayoutContentEventCallback)
  }
}
