export interface Tv2StudioBlueprintConfiguration {
  ABMediaPlayers: Tv2MediaPlayer[]
}

export interface Tv2MediaPlayer {
  // These values need to match the values defined in Blueprints
  _id: string
  SourceName: string // This is used as the Id for the MediaPlayer...
  SwitcherSource: number
}
