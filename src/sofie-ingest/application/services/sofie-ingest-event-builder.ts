import { MediaEventBuilder } from '../interfaces/media-event-builder'
import { Media } from '../../domain/entities/media'
import { MediaCreatedEvent, MediaDeletedEvent, MediaUpdatedEvent } from '../value-objects/media-event'
import { MediaEventType } from '../enums/media-event-type'
import { MediaDto } from '../dtos/media-dto'
import { VideoMixerConfiguration } from '../../domain/value-objects/video-mixer-configuration'
import { VideoMixerConfigurationUpdatedEvent } from '../value-objects/device-event'
import { DeviceEventType } from '../enums/device-event-type'
import { DeviceEventBuilder } from '../interfaces/device-event-builder'

export class SofieIngestEventBuilder implements MediaEventBuilder, DeviceEventBuilder {
  public buildMediaCreatedEvent(media: Media): MediaCreatedEvent {
    return {
      type: MediaEventType.MEDIA_CREATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaUpdatedEvent(media: Media): MediaUpdatedEvent {
    return {
      type: MediaEventType.MEDIA_UPDATED,
      timestamp: Date.now(),
      media: new MediaDto(media),
    }
  }

  public buildMediaDeletedEvent(mediaId: string): MediaDeletedEvent {
    return {
      type: MediaEventType.MEDIA_DELETED,
      timestamp: Date.now(),
      mediaId: mediaId,
    }
  }

  public buildVideoMixerConfigurationUpdatedEvent(videoMixerConfiguration: VideoMixerConfiguration): VideoMixerConfigurationUpdatedEvent {
    return {
      type: DeviceEventType.VIDEO_MIXER_CONFIGURATION_UPDATED,
      videoMixer: videoMixerConfiguration,
      timestamp: Date.now()
    }
  }
}
