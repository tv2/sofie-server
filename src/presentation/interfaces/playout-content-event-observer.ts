import { PlayoutContentEvent } from '../value-objects/playout-content-event'

export interface PlayoutContentEventObserver {
  subscribeToPlayoutContentEvents(onPlayoutContentEventCallback: (playoutContentEvent: PlayoutContentEvent) => void): void
}
