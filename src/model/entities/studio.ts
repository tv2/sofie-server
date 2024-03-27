import { StudioLayer } from '../value-objects/studio-layer'

export interface Studio {
  settings: StudioSettings
  layers: StudioLayer[]
  blueprintConfiguration: unknown
}

export interface StudioSettings {
  mediaPreviewUrl: string
}
