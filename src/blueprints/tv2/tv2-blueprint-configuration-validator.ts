import { Configuration } from '../../model/entities/configuration'
import { StatusMessage } from '../../model/entities/status-message'
import { BlueprintValidateConfiguration } from '../../model/value-objects/blueprint'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { StatusCode } from '../../model/enums/status-code'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'
import { CoreShowStyleVariantBlueprintConfiguration } from './helpers/tv2-show-style-blueprint-configuration-mapper'

export class Tv2BlueprintConfigurationValidator implements BlueprintValidateConfiguration {

  constructor(private readonly configurationMapper: Tv2ConfigurationMapper) { }


  public validateConfiguration(configuration: Configuration): StatusMessage[] {
    const tv2BlueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration, '')
    // Add validation as needed.
    return [
      ...this.validateShowStyleConfiguration(tv2BlueprintConfiguration.showStyle),
      ...this.validateShowStyleVariants(configuration.showStyle.variants)
    ]
  }

  private validateShowStyleConfiguration(showStyleConfiguration: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    return [
      ...this.validateGraphicsSchemas(showStyleConfiguration)
    ]
  }

  private validateGraphicsSchemas(showStyleConfiguration: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    return showStyleConfiguration.graphicsSchemas.flatMap(schema => {
      return schema.casparCgDesignValues
        .filter(designValues => designValues.name?.includes(' '))
        .map(designValue => {
          return {
            id: `${schema.iNewsName}_${schema.iNewsSchemaColumn}`,
            title: `${schema.iNewsName} Schema Configuration`,
            message: `The Schema ${schema.iNewsName} has an invalid CasparCg design value, since the design name '${designValue.name}' must not contain whitespace`,
            statusCode: StatusCode.BAD
          }
        })
    })
  }

  private validateShowStyleVariants(showStyleVariants: ShowStyleVariant[]): StatusMessage[] {
    return showStyleVariants
      .filter(variant => !Array.isArray((variant.blueprintConfiguration as CoreShowStyleVariantBlueprintConfiguration).GfxDefaults))
      .map(variant => {
        return {
          id: `${variant.id}_noGraphicsDefault`,
          title: `Misconfigured ShowStyleVariant ${variant.name}`,
          message: `ShowStyleVariant ${variant.name} does not have a 'GraphicsDefault' configured.`,
          statusCode: StatusCode.BAD
        }
      })
  }
}
