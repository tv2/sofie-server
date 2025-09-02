import { Configuration } from '../../../rundown-execution/domain/entities/configuration'
import { StatusMessage } from '../../../cross-cutting-concerns/domain/entities/status-message'
import { BlueprintValidateConfiguration } from '../../../rundown-execution/domain/value-objects/blueprint'
import { Tv2ConfigurationMapper } from './tv2-configuration-mapper'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import { StatusCode } from '../../../cross-cutting-concerns/domain/enums/status-code'
import { ShowStyleVariant } from '../../../rundown-execution/domain/entities/show-style-variant'
import { CoreShowStyleVariantBlueprintConfiguration } from './tv2-show-style-blueprint-configuration-mapper'

export class Tv2BlueprintConfigurationValidator implements BlueprintValidateConfiguration {
  public constructor(private readonly configurationMapper: Tv2ConfigurationMapper) { }

  public validateConfiguration(configuration: Configuration): StatusMessage[] {
    const tv2BlueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration, '')
    // Add validation as needed.
    return [
      ...this.validateShowStyleConfiguration(tv2BlueprintConfiguration.showStyle),
      ...this.validateShowStyleVariants(configuration.showStyle.variants),
      ...this.validateVideoMixerSourceForFullscreenGraphicsBackground(tv2BlueprintConfiguration)
    ]
  }

  private validateShowStyleConfiguration(showStyleConfiguration: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    return [
      ...this.validateGraphicsSchemas(showStyleConfiguration),
      ...this.validateGraphicsDefaults(showStyleConfiguration),
      ...this.validateTransitions(showStyleConfiguration),
    ]
  }

  private validateGraphicsSchemas(showStyleConfiguration: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    return showStyleConfiguration.graphicsSchemas.flatMap((schema) => {
      return schema.casparCgDesignValues
        .filter(designValues => designValues.name?.includes(' '))
        .map((designValue) => {
          return {
            id: `${schema.iNewsName}_${schema.iNewsSchemaColumn}`,
            title: `${schema.iNewsName} Schema Configuration`,
            message: `The Schema ${schema.iNewsName} has an invalid CasparCg design value, since the design name '${designValue.name}' must not contain whitespace`,
            statusCode: StatusCode.BAD
          }
        })
    })
  }

  private validateGraphicsDefaults(showStyleConfiguration: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    if (!showStyleConfiguration.graphicsDefault) {
      return [{
        id: 'GraphicsDefaultMissing',
        title: 'Graphics Default Configuration',
        message: 'Graphics default configuration is missing',
        statusCode: StatusCode.BAD
      }]
    }

    if (!showStyleConfiguration.graphicsDefault.setupName?.value) {
      return [{
        id: 'DefaultSetupName',
        title: 'Default Setup Name Configuration',
        message: 'The Default Setup Name is missing or empty',
        statusCode: StatusCode.BAD
      }]
    }

    if (!showStyleConfiguration.graphicsDefault.schema?.value) {
      return [{
        id: 'DefaultSchema',
        title: 'Default Schema Configuration',
        message: 'The Default Schema is missing or empty',
        statusCode: StatusCode.BAD
      }]
    }

    if (!showStyleConfiguration.graphicsDefault.design?.value) {
      return [{
        id: 'DefaultDesign',
        title: 'Default Design Configuration',
        message: 'The Default Design is missing or empty',
        statusCode: StatusCode.BAD
      }]
    }
    return []
  }

  private validateShowStyleVariants(showStyleVariants: ShowStyleVariant[]): StatusMessage[] {
    return showStyleVariants
      .filter(variant => !Array.isArray((variant.blueprintConfiguration as CoreShowStyleVariantBlueprintConfiguration).GfxDefaults))
      .map((variant) => {
        return {
          id: `${variant.id}_noGraphicsDefault`,
          title: `Misconfigured ShowStyleVariant ${variant.name}`,
          message: `ShowStyleVariant ${variant.name} does not have a 'GraphicsDefault' configured.`,
          statusCode: StatusCode.BAD
        }
      })
  }

  private validateTransitions(showStyleVariant: Tv2ShowStyleBlueprintConfiguration): StatusMessage[] {
    const configuredBreakerNames: Set<string> = new Set(showStyleVariant.breakers.map(breaker => breaker.name))
    return showStyleVariant.breakerTransitionEffectConfigurations
      .filter(breakerTransitionEffect => !configuredBreakerNames.has(breakerTransitionEffect.name))
      .map(breakerTransitionEffect => ({
        id: `missingBreakerConfigurationEntry_${this.sanitizeStringForId(breakerTransitionEffect.name)}`,
        title: 'Missing breaker configuration',
        message: `No breaker configuration found for the transition '${breakerTransitionEffect.name}'.`,
        statusCode: StatusCode.WARNING,
        lastUpdatedTimestamp: Date.now()
      }))
  }

  private sanitizeStringForId(value: string): string {
    return Buffer.from(value).toString('hex')
  }

  private validateVideoMixerSourceForFullscreenGraphicsBackground(configuration: Tv2BlueprintConfiguration): StatusMessage[] {
    const videoMixerSourceForFullscreenGraphicsBackground: number | undefined = configuration.studio.vizPilotGraphics.videoMixerSourceForFullscreenGraphicsBackground
    if (!!videoMixerSourceForFullscreenGraphicsBackground && videoMixerSourceForFullscreenGraphicsBackground > 0) {
      return []
    }
    return [
      {
        id: 'missingVideoMixerSourceForFullscreenGraphicsBackground',
        title: 'Missing video mixer source',
        message: 'Missing a video mixer source for fullscreen graphics background',
        statusCode: StatusCode.WARNING,
        lastUpdatedTimestamp: Date.now()
      }
    ]
  }
}
