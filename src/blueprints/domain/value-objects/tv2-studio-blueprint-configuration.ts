import { DeviceType } from '../../../sofie-ingest/domain/enums/device-type'

export interface Tv2StudioBlueprintConfiguration {
  cameraSources: Tv2SourceMappingWithAudio[]
  remoteSources: Tv2SourceMappingWithAudio[]
  feedSources: Tv2SourceMappingWithAudio[]
  auxiliarySources: Tv2SourceAuxiliaryMapping[]
  replaySources: Tv2SourceMappingWithAudio[]
  studioMicrophones: string[]
  mediaPlayers: Tv2MediaPlayer[]
  videoMixerType: VideoMixerType
  videoMixerBasicConfiguration: Tv2VideoMixerBasicConfiguration
  casparcgPreRollDuration: number
  serverPostRollDuration: number
  splitScreenFolder?: Tv2FolderConfiguration
  jingleFolder?: Tv2FolderConfiguration
  graphicsFolder: Tv2FolderConfiguration
  selectedGraphicsType: Tv2GraphicsType
  vizPilotGraphics: Tv2VizPilotGraphics
  htmlGraphics?: Tv2HtmlGraphics
  shouldPreventOverlayWhileFullscreenGraphicsIsOnAir: boolean
  audioBedSettings: AudioBedSettings
}

export type VideoMixerType = DeviceType.ATEM | DeviceType.TRICASTER

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
  preRollDurationInMsForCleanFeed?: number
  keepPreviousPartAliveDurationInMs: number
  preRollDurationInMs: number
  outTransitionDurationInMs: number
  fullscreenGraphicsBackgroundStartOffsetInMs: number
  videoMixerSourceForFullscreenGraphicsBackground: number
}

export interface Tv2HtmlGraphics {
  msKeepOldPartAliveBeforeTakingGraphics: number
  graphicsUrl: string
  transitionSettings: {
    wipeRate: number
    borderSoftness: number
  }
}

export interface Tv2SourceMapping {
  id: string
  name: string
  videoMixerSource: number
}

export interface Tv2SourceAuxiliaryMapping {
  auxiliaryId: string
  layerId: string
}

export interface Tv2MediaPlayer extends Tv2SourceMapping { }

export interface Tv2SourceMappingWithAudio extends Tv2SourceMapping {
  audioLayers: string[]
  usesStudioMicrophones: boolean
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
  index: number
  videoMixerKeySource: number
  videoMixerFillSource: number
  defaultOn: boolean
  roles: Tv2DownstreamKeyerRole[]
  videoMixerClip: number
  videoMixerGain: number
}

export enum Tv2DownstreamKeyerRole {
  FULL_GRAPHICS = 'FULL_GRAPHICS',
  OVERLAY_GRAPHICS = 'OVERLAY_GRAPHICS',
  JINGLE = 'JINGLE'
}

export interface AudioBedSettings {
  mediaDirectory: string
  fadeInDurationFrames: number
  fadeOutDurationInFrames: number
  volume: number
  useAudioFilterSyntax: boolean
}
