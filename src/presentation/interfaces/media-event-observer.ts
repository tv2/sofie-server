import { MediaEvent } from '../value-objects/media-event'

export interface MediaEventObserver {
  subscribeToMediaEvents(onMediaEventCallback: (mediaEvent: MediaEvent) => void): void
}
