// These names must match what Blueprints calls them. TODO: Change to something more sensible when we control settings.
export interface Tv2StudioBlueprintConfiguration {
  SourcesCam: Tv2SourceMappingWithSound[] // Cameras
  SourcesRM: Tv2SourceMappingWithSound[] // Lives
  SourcesReplay: Tv2SourceMappingWithSound[] // Replays
  StudioMics: string[]
  ABMediaPlayers: Tv2MediaPlayer[]
  SwitcherSource: Tv2VideoMixerSources
  CasparPrerollDuration: number
  ServerPostrollDuration: number
  DVEFolder?: string,
  JingleFolder?: string
  AudioBedSettings: {
    fadeIn: number,
    fadeOut: number,
    volume: number
  }
}

export interface Tv2SourceMapping {
  _id: string
  SourceName: string
  SwitcherSource: number
}

export interface Tv2MediaPlayer extends Tv2SourceMapping { }

export interface Tv2SourceMappingWithSound extends Tv2SourceMapping {
  SisyfosLayers: string[]
  StudioMics: boolean
  WantsToPersistAudio?: boolean
  AcceptPersistAudio?: boolean
}

export interface Tv2VideoMixerSources {
  Default: number
  SplitArtFill: number
  SplitArtKey: number
  DSK: Tv2DownstreamKeyer[]
  Dip: number
}

export interface Tv2DownstreamKeyer {
  _id: string
  Number: number
  Key: number
  Fill: number
  DefaultOn: boolean
  Roles: Tv2DownstreamKeyerRole[]
  Clip: number,
  Gain: number
}

export enum Tv2DownstreamKeyerRole {
  FULL_GRAPHICS = 'full_graphics',
  OVERLAY_GRAPHICS = 'overlay_graphics',
  JINGLE = 'jingle'
}


