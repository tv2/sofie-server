// These are taking from Blueprints BaseContent
import { TimelineObject } from '../../../model/entities/timeline-object'

export interface Tv2Content {
  ignoreMediaObjectStatus?: boolean
  ignoreBlackFrames?: boolean
  ignoreFreezeFrame?: boolean
  // TODO: These values are included in Blueprints
  // ignoreAudioFormat?: boolean
  // sourceDuration?: number
}

export interface Tv2GraphicsContent extends Tv2Content {
  fileName: string
  path: string
  mediaFlowIds?: string[]
  // TODO: These values are included in Blueprints
  // thumbnail?: string
  // templateData?: Record<string, any>
}

export interface Tv2TimelineObjectContent extends Tv2Content {
  timelineObjects: TimelineObject[]
}

export type Tv2TimelineObjectGraphicsContent = Tv2GraphicsContent & Tv2TimelineObjectContent
