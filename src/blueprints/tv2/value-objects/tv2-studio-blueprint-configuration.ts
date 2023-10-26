// These names must match what Blueprints calls them. TODO: Change to something more sensible when we control settings.
export interface Tv2StudioBlueprintConfiguration {
  SourcesCam: Tv2SourceMappingWithSound[] // Cameras
  SourcesRM: Tv2SourceMappingWithSound[] // Lives
  StudioMics: string[]
  ABMediaPlayers: Tv2MediaPlayer[]
  SwitcherSource: Tv2SwitcherSource
  CasparPrerollDuration: number,
  ServerPostrollDuration: number
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

export interface Tv2SwitcherSource {
  DSK: Tv2DownstreamKeyer[]
}

export interface Tv2DownstreamKeyer {
  _id: string
  Number: number
  Key: number
  Fill: number
  DefaultOn: boolean
  Roles: string[]
  Clip: number,
  Gain: number
}


