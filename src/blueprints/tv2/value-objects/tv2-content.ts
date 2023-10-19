// These are taking from Blueprints BaseContent
import { TimelineObject } from '../../../model/entities/timeline-object'

export interface Tv2Content {
  // TODO: These values are included in Blueprints
  // sourceDuration?: number
  // ignoreMediaObjectStatus?: boolean
  // ignoreBlackFrames?: boolean
  // ignoreFreezeFrame?: boolean
  // ignoreAudioFormat?: boolean
}

export interface Tv2GraphicsContent extends Tv2Content {
  fileName: string
  path: string
  // TODO: These values are included in Blueprints
  // mediaFlowIds?: string[]
  // thumbnail?: string
  // templateData?: Record<string, any>
}

export interface Tv2TimelineObjectContent extends Tv2Content {
  timelineObjects: TimelineObject[]
}

export type Tv2TimelineObjectGraphicContent = Tv2GraphicsContent & Tv2TimelineObjectContent
