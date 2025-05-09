import { Rundown } from '../../model/entities/rundown'
import { PlayoutContentReadService, PlayoutContentUpdateService } from './interfaces/playout-content-service'
import { PlayoutContentEventEmitter } from './interfaces/playout-content-event-emitter'
import { PlayoutContent } from '../../model/value-objects/playout-content'
import { RundownMode } from '../../model/enums/rundown-mode'

export class PlayoutContentStateService implements PlayoutContentUpdateService, PlayoutContentReadService {

  private static instance: PlayoutContentUpdateService & PlayoutContentReadService

  public static getInstance(playoutContentEventEmitter: PlayoutContentEventEmitter): PlayoutContentUpdateService & PlayoutContentReadService {
    if (!this.instance) {
      this.instance = new PlayoutContentStateService(playoutContentEventEmitter)
    }
    return this.instance
  }

  private programPlayoutContents: PlayoutContent[] = []
  private previewPlayoutContents: PlayoutContent[] = []

  constructor(private readonly playoutContentEventEmitter: PlayoutContentEventEmitter) {
  }

  public updatePlayoutContentState(rundown: Rundown): void {
    if (rundown.getMode() == RundownMode.INACTIVE) {
      this.resetProgramPlayoutContents()
      this.resetPreviewPlayoutContents()
      return
    }

    this.updateProgramPlayoutContents(rundown)
    this.updatePreviewPlayoutContents(rundown)
  }

  private resetProgramPlayoutContents(): void {
    if (this.programPlayoutContents.length === 0) {
      return
    }

    this.programPlayoutContents = []
    this.playoutContentEventEmitter.emitProgramPlayoutContentEvent(this.programPlayoutContents)
  }

  private resetPreviewPlayoutContents(): void {
    if (this.previewPlayoutContents.length === 0) {
      return
    }

    this.previewPlayoutContents = []
    this.playoutContentEventEmitter.emitPreviewPlayoutContentEvent(this.previewPlayoutContents)
  }

  private updateProgramPlayoutContents(rundown: Rundown): void {
    if (!rundown.isActivePartSet()) {
      this.resetProgramPlayoutContents()
      return
    }
    const programPlayoutContents: PlayoutContent[] = rundown.getActivePart().getPieces().map(piece => piece.metadata.playoutContent)
    if (this.areArraysEqual(this.programPlayoutContents, programPlayoutContents)) {
      return
    }
    this.programPlayoutContents = programPlayoutContents
    this.playoutContentEventEmitter.emitProgramPlayoutContentEvent(this.programPlayoutContents)
  }

  private areArraysEqual(arrayOne: unknown[], arrayTwo: unknown[]): boolean {
    if (arrayOne.length !== arrayTwo.length) {
      return false
    }
    const isAllEntriesOfArrayOneIsInArrayTwo: boolean = arrayOne.every(entry => arrayTwo.includes(entry))
    const isAllEntriesOfArrayTwoIsInArrayOne: boolean = arrayTwo.every(entry => arrayOne.includes(entry))
    return isAllEntriesOfArrayOneIsInArrayTwo && isAllEntriesOfArrayTwoIsInArrayOne
  }

  private updatePreviewPlayoutContents(rundown: Rundown): void {
    const previewPlayoutContents: PlayoutContent[] = rundown.getNextPart().getPieces().map(piece => piece.metadata.playoutContent)
    if (this.areArraysEqual(this.previewPlayoutContents, previewPlayoutContents)) {
      return
    }
    this.previewPlayoutContents = previewPlayoutContents
    this.playoutContentEventEmitter.emitPreviewPlayoutContentEvent(this.previewPlayoutContents)
  }

  public getProgramPlayoutContentState(): readonly PlayoutContent[] {
    return this.programPlayoutContents
  }

  public getPreviewPlayoutContentState(): readonly PlayoutContent[] {
    return this.previewPlayoutContents
  }
}
