import { Rundown } from '../../domain/entities/rundown'
import { PlayoutContentReadService, PlayoutContentUpdateService } from '../interfaces/playout-content-service'
import { PlayoutContentEventEmitter } from '../interfaces/playout-content-event-emitter'
import { PlayoutContent } from '../../domain/value-objects/playout-content'
import { RundownMode } from '../../domain/enums/rundown-mode'
import { PlayoutContentType } from '../../domain/enums/playout-content-type'
import { PlayoutContentRepository } from '../../domain/repositories/playout-content-repository'

const INFINITE_PIECES_PLAYOUT_CONTENT_TYPES: PlayoutContentType[] = [PlayoutContentType.DOWNSTREAM_KEYER]

// TODO: Determine if this should be moved to Alba TV 2 server.
export class PlayoutContentStateService implements PlayoutContentUpdateService, PlayoutContentReadService {
  private programPlayoutContents: PlayoutContent[] = []
  private previewPlayoutContents: PlayoutContent[] = []

  constructor(
    private readonly playoutContentEventEmitter: PlayoutContentEventEmitter,
    private readonly playoutContentRepository: PlayoutContentRepository
  ) {
  }

  public async initialize(): Promise<void> {
    await this.updatePlayoutContentsFromDatabase()
  }

  private async updatePlayoutContentsFromDatabase(): Promise<void> {
    this.programPlayoutContents = await this.playoutContentRepository.getProgramPlayoutContents()
    this.previewPlayoutContents = await this.playoutContentRepository.getPreviewPlayoutContents()
  }

  public async updatePlayoutContentState(rundown: Rundown): Promise<void> {
    if (rundown.getMode() == RundownMode.INACTIVE) {
      this.resetProgramPlayoutContents()
      this.resetPreviewPlayoutContents()
      await this.savePlayoutContents()
      return
    }

    this.updateProgramPlayoutContents(rundown)
    this.updatePreviewPlayoutContents(rundown)
    await this.savePlayoutContents()
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

  private async savePlayoutContents(): Promise<void> {
    await this.playoutContentRepository.savePlayoutContents(this.programPlayoutContents, this.previewPlayoutContents)
  }

  private updateProgramPlayoutContents(rundown: Rundown): void {
    if (!rundown.isActivePartSet()) {
      this.resetProgramPlayoutContents()
      return
    }

    const infinitePiecesPlayoutContents: PlayoutContent[] = rundown.getInfinitePieces()
      .filter(piece => INFINITE_PIECES_PLAYOUT_CONTENT_TYPES.includes(piece.metadata.playoutContent.type))
      .map(piece => piece.metadata.playoutContent)

    const programPlayoutContents: PlayoutContent[] = rundown.getActivePart().getPieces()
      .filter(piece => !INFINITE_PIECES_PLAYOUT_CONTENT_TYPES.includes(piece.metadata.playoutContent.type))
      .map(piece => piece.metadata.playoutContent)
      .concat(infinitePiecesPlayoutContents)

    if (this.areArraysEqual(this.programPlayoutContents, programPlayoutContents)) {
      return
    }
    this.programPlayoutContents = programPlayoutContents
    this.playoutContentEventEmitter.emitProgramPlayoutContentEvent(this.programPlayoutContents)
  }

  // TODO: This can be simplified by only checking the occurrences from arrayOne in arrayTwo as they have the same length.
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
