import { Configuration } from '../../model/entities/configuration'
import { StatusMessage } from '../../model/entities/status-message'
import { BlueprintValidateConfiguration } from '../../model/value-objects/blueprint'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from './value-objects/tv2-show-style-blueprint-configuration'
import { StatusCode } from '../../model/enums/status-code'

export class Tv2BlueprintConfigurationValidator implements BlueprintValidateConfiguration {

  constructor(private readonly configurationMapper: Tv2ConfigurationMapper) { }


  public validateConfiguration(configuration: Configuration): StatusMessage[] {
    const tv2BlueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration)
    // Add validation as needed.
    return [
      ...this.validateShowStyleConfiguration(tv2BlueprintConfiguration.showStyle)
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
}
