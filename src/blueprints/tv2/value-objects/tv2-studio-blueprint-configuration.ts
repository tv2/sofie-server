export interface Tv2StudioBlueprintConfiguration {
  cameraeSources: Tv2SourceMappingWithSound[]
  remoteSources: Tv2SourceMappingWithSound[]
  replaySources: Tv2SourceMappingWithSound[]
  studioMicrophones: string[]
  mediaPlayers: Tv2MediaPlayer[]
  videoMixerBasicConfiguration: Tv2VideoMixerBasicConfiguration
  casparCgPreRollDuration: number
  serverPostRollDuration: number
  splitScreenFolder?: Tv2FolderConfiguration
  jingleFolder?: Tv2FolderConfiguration
  graphicsFolder: Tv2FolderConfiguration
  selectedGraphicsType: Tv2GraphicsType
  vizPilotGraphics: Tv2VizPilotGraphics
  htmlGraphics: Tv2HtmlGraphics
  preventOverlayWhileFullscreenGraphicsIsOnAir: boolean
}

export interface Tv2FolderConfiguration {
  name?: string
  networkBasePath: string
  fileExtension: string
  mediaFlowId: string
  ignoreMediaStatus: boolean
}

export enum Tv2GraphicsType {
  VIZ = 'VIZ',
  HTML = 'HTML'
}

export interface Tv2VizPilotGraphics {
  msBeforeShowingBeforeShowingOnCleanFeed?: number
  msKeepOldPartAliveBeforeTakingGraphics: number
  msPreRollBeforeTakingPilotGraphics: number
  msKeepPilotGraphicsAliveBeforeTakingNext: number
  msFromStartBeforeCuttingToBackgroundSource: number
  backgroundVideoSwitcherSource: number
}

export interface Tv2HtmlGraphics {
  msKeepOldPartAliveBeforeTakingGraphics: number
  graphicsUrl: string
  transitionSettings: {
    wipeRate: number,
    borderSoftness: number
  }
}

export interface Tv2SourceMapping {
  id: string
  name: string
  videoMixerSource: number
}

export interface Tv2MediaPlayer extends Tv2SourceMapping { }

export interface Tv2SourceMappingWithSound extends Tv2SourceMapping {
  sisyfosLayers: string[]
  studioMicrophones: boolean
  wantsToPersistAudio?: boolean
  acceptPersistAudio?: boolean
}

export interface Tv2VideoMixerBasicConfiguration {
  defaultVideoMixerSource: number
  splitScreenArtFillSource: number
  splitScreenArtKeySource: number
  downstreamKeyers: Tv2DownstreamKeyer[]
  dipVideoMixerSource: number
}

export interface Tv2DownstreamKeyer {
  id: string // This id isn't really used
  name: number // For some reason this is a number
  videoMixerKeySource: number
  videoMixerFillSource: number
  defaultOn: boolean
  roles: Tv2DownstreamKeyerRole[]
  videoMixerClip: number,
  videoMixerGain: number
}

export enum Tv2DownstreamKeyerRole {
  FULL_GRAPHICS = 'FULL_GRAPHICS',
  OVERLAY_GRAPHICS = 'OVERLAY_GRAPHICS',
  JINGLE = 'JINGLE'
}


