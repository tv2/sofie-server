import { Rundown } from '../../model/entities/rundown'
import { PlayoutContentService } from './interfaces/playout-content-service'
import { PlayoutContentEventEmitter } from './interfaces/playout-content-event-emitter'

export class PlayoutContentStateService implements PlayoutContentService {

  constructor(private readonly playoutContentEventEmitter: PlayoutContentEventEmitter) {
  }

  public updatePlayoutContentState(rundown: Rundown): void {
    console.log(rundown)
  }
}
