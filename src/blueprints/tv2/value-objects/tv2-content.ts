// These are taking from Blueprints BaseContent

export interface Tv2Content {
  // ignoreMediaObjectStatus?: boolean
  // ignoreBlackFrames?: boolean
  // ignoreFreezeFrame?: boolean
  // TODO: These values are included in Blueprints
  // ignoreAudioFormat?: boolean
  // sourceDuration?: number
}

export interface Tv2FileContent extends Tv2Content {
  fileName: string
  // path: string
  // mediaFlowIds?: string[]
  // TODO: These values are included in Blueprints
  // thumbnail?: string
  // templateData?: Record<string, any>
}
