import { Tv2ShowStyleBlueprintConfigurationMapper } from './tv2-show-style-blueprint-configuration-mapper'
import { Tv2StudioBlueprintConfigurationMapper } from './tv2-studio-blueprint-configuration-mapper'
import { Configuration } from '../../../model/entities/configuration'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2ConfigurationMapper {

  constructor(
    private readonly studioMapper: Tv2StudioBlueprintConfigurationMapper,
    private readonly showStyleMapper: Tv2ShowStyleBlueprintConfigurationMapper
  ) {}

  public mapBlueprintConfiguration(configuration: Configuration, showStyleVariantId: string): Tv2BlueprintConfiguration {
    return {
      studio: this.studioMapper.mapStudioConfiguration(configuration.studio),
      showStyle: this.showStyleMapper.mapShowStyleConfiguration(configuration.showStyle, showStyleVariantId)
    }
  }
}
