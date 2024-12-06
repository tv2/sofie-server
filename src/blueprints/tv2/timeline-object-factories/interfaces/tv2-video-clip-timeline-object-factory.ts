import { Tv2VideoClipManifestData } from '../../value-objects/tv2-action-manifest-data'
import { Tv2BlueprintTimelineObject } from '../../value-objects/tv2-metadata'

export interface Tv2VideoClipTimelineObjectFactory {
  createVideoClipTimelineObject(videoClipData: Tv2VideoClipManifestData): Tv2BlueprintTimelineObject
  createBreakerTimelineObject(file: string): Tv2BlueprintTimelineObject
}
