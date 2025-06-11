import { Tv2StudioBlueprintConfiguration } from './tv2-studio-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './tv2-show-style-blueprint-configuration'

export interface Tv2BlueprintConfiguration {
  studio: Tv2StudioBlueprintConfiguration,
  showStyle: Tv2ShowStyleBlueprintConfiguration
}
