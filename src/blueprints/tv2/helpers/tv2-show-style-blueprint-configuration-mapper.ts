import {
  Breaker,
  BreakerTransitionEffect,
  GraphicsDefault,
  GraphicsSchema,
  GraphicsSetup,
  GraphicsTemplate,
  SplitScreenConfiguration,
  TransitionEffectType,
  Tv2ShowStyleBlueprintConfiguration,
  Tv2ShowStyleVariantBlueprintConfiguration
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { ShowStyle } from '../../../model/entities/show-style'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { ShowStyleVariant } from '../../../model/entities/show-style-variant'

interface CoreShowStyleBlueprintConfiguration {
  GfxDefaults: CoreGraphicsDefault[]
  GfxSetups: CoreGraphicsSetup[]
  GfxTemplates: CoreGraphicsTemplate[]
  GfxSchemaTemplates: CoreGraphicsSchema[]
  DVEStyles: CoreSplitScreenConfiguration[]
  BreakerConfig: CoreBreaker[]
  Transitions: Transition[]
  ShowstyleTransition: string
}

interface Transition {
  _id: string
  Transition: string
}

interface CoreGraphicsDefault {
  DefaultSetupName: { value: string; label: string }
  DefaultSchema: { value: string; label: string }
  DefaultDesign: { value: string; label: string }
}

interface CoreGraphicsSetup {
  _id: string
  Name: string
  HtmlPackageFolder: string
  OvlShowName?: string
  FullShowName?: string
}

interface CoreGraphicsTemplate {
  VizTemplate: string
  OutType?: string
}

interface CoreGraphicsSchema {
  VizTemplate: string
  INewsSkemaColumn: string
  GfxSchemaTemplatesName: string
  CasparCgDesignValues: string
}

interface CoreSplitScreenConfiguration {
  _id: string
  DVEName: string
  DVEInputs: string
  DVEJSON: string
  DVEGraphicsTemplateJSON: string
  DVEGraphicsKey: string
  DVEGraphicsFrame: string
}

interface CoreBreaker {
  _id: string
  BreakerName: string
  ClipName: string
  Duration: number
  StartAlpha: number
  EndAlpha: number
  Autonext: boolean
  LoadFirstFrame: boolean
}

export interface CoreShowStyleVariantBlueprintConfiguration {
  GfxDefaults?: CoreGraphicsDefault[]
}

export class Tv2ShowStyleBlueprintConfigurationMapper {

  public mapShowStyleConfiguration(showStyle: ShowStyle, showStyleVariantId: string): Tv2ShowStyleBlueprintConfiguration {
    const coreConfiguration: CoreShowStyleBlueprintConfiguration = { ...(showStyle.blueprintConfiguration as CoreShowStyleBlueprintConfiguration) }
    const showStyleVariantBlueprintConfiguration: Tv2ShowStyleVariantBlueprintConfiguration | undefined = this.findShowStyleVariantBlueprintConfiguration(showStyleVariantId, showStyle)

    return {
      graphicsDefault: this.mapGraphicsDefault(coreConfiguration.GfxDefaults),
      graphicsSetups: this.mapGraphicsSetups(coreConfiguration.GfxSetups),
      graphicsTemplates: this.mapGraphicsTemplates(coreConfiguration.GfxTemplates),
      graphicsSchemas: this.mapGraphicsSchemas(coreConfiguration.GfxSchemaTemplates),
      selectedGraphicsSetup: this.findSelectedGraphicsSetup(showStyleVariantBlueprintConfiguration, coreConfiguration.GfxDefaults, coreConfiguration.GfxSetups),
      splitScreenConfigurations: this.mapSplitScreenConfigurations(coreConfiguration.DVEStyles),
      breakerTransitionEffectConfigurations: this.mapBreakerTransitionEffectConfigurations( 
        coreConfiguration.ShowstyleTransition,
        coreConfiguration.Transitions),
      breakers: this.mapToBreakers(coreConfiguration.BreakerConfig)
    }
  }

  private mapBreakerTransitionEffectConfigurations(showstyleTransition: string, coreTransitions?: Transition[]) : BreakerTransitionEffect[] {
    if (!coreTransitions) {
      return []
    }

    const transitions: string[] = coreTransitions.map(transition => transition.Transition).filter(transition => transition !== undefined)

    return this.mapTransitionEffectConfigurations([...transitions, showstyleTransition])  
  }
    
  private findShowStyleVariantBlueprintConfiguration(showStyleVariantId: string, showStyle: ShowStyle): Tv2ShowStyleVariantBlueprintConfiguration | undefined {
    const showStyleVariant: ShowStyleVariant | undefined = showStyle.variants.find(variant => variant.id === showStyleVariantId)
    if (!showStyleVariant) {
      return
    }
    const coreVariantBlueprintConfiguration: CoreShowStyleVariantBlueprintConfiguration = showStyleVariant.blueprintConfiguration as CoreShowStyleVariantBlueprintConfiguration
    if (!coreVariantBlueprintConfiguration.GfxDefaults || coreVariantBlueprintConfiguration.GfxDefaults.length === 0) {
      return
    }
    return {
      graphicsDefault: this.mapGraphicsDefault(coreVariantBlueprintConfiguration.GfxDefaults)
    }
  }

  private mapGraphicsDefault(coreGraphicsDefaults: CoreGraphicsDefault[]): GraphicsDefault {
    return {
      setupName: coreGraphicsDefaults[0].DefaultSetupName,
      schema: coreGraphicsDefaults[0].DefaultSchema,
      design: coreGraphicsDefaults[0].DefaultDesign
    }
  }

  private mapGraphicsSetups(coreGraphicsSetups?: CoreGraphicsSetup[]): GraphicsSetup[] {
    if (!coreGraphicsSetups) {
      return []
    }
    
    return coreGraphicsSetups.map(setup => {
      return {
        id: setup._id,
        name: setup.Name,
        htmlPackageFolder: setup.HtmlPackageFolder,
        overlayShowName: setup.OvlShowName,
        fullShowName: setup.FullShowName
      }
    })
  }


  private mapGraphicsTemplates(coreGraphicsTemplates?: CoreGraphicsTemplate[]): GraphicsTemplate[] {
    if(!coreGraphicsTemplates) {
      return []
    }

    return coreGraphicsTemplates.map(template => {
      return {
        name: template.VizTemplate,
        lifespan: this.getLifespanFromTemplateOutType(template.OutType),
      }
    })
  }

  private getLifespanFromTemplateOutType(outType?: string): PieceLifespan {
    switch (outType) {
      case 'S':
        return PieceLifespan.SPANNING_UNTIL_SEGMENT_END
      case 'O':
        return PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE
      case 'B':
      default:
        return PieceLifespan.WITHIN_PART
    }
  }

  private mapGraphicsSchemas(coreGraphicsSchemas?: CoreGraphicsSchema[]): GraphicsSchema[] {
    if(!coreGraphicsSchemas) {
      return []
    }

    return coreGraphicsSchemas.map(schema => {
      return {
        iNewsName: schema.VizTemplate,
        iNewsSchemaColumn: schema.INewsSkemaColumn,
        graphicsTemplateName: schema.GfxSchemaTemplatesName,
        casparCgDesignValues: schema.CasparCgDesignValues ? JSON.parse(schema.CasparCgDesignValues) : []
      }
    })
  }

  private findSelectedGraphicsSetup(showStyleVariantConfiguration: Tv2ShowStyleVariantBlueprintConfiguration | undefined, coreGraphicsDefaults: CoreGraphicsDefault[], coreGraphicsSetups: CoreGraphicsSetup[]): GraphicsSetup {
    const selectedGraphicsSetup: CoreGraphicsSetup | undefined = coreGraphicsSetups.find(setup => setup._id === showStyleVariantConfiguration?.graphicsDefault.setupName.value)
      ?? coreGraphicsSetups.find(setup => setup._id === coreGraphicsDefaults[0].DefaultSetupName.value)
    if (!selectedGraphicsSetup) {
      throw new Error('Unable to find any selected graphics setup')
    }
    return {
      id: selectedGraphicsSetup._id,
      name: selectedGraphicsSetup.Name,
      htmlPackageFolder: selectedGraphicsSetup.HtmlPackageFolder,
      overlayShowName: selectedGraphicsSetup.OvlShowName,
      fullShowName: selectedGraphicsSetup.FullShowName
    }
  }

  private mapSplitScreenConfigurations(coreSplitScreenConfigurations?: CoreSplitScreenConfiguration[]): SplitScreenConfiguration[] {
    if(!coreSplitScreenConfigurations) {
      return []
    }
    
    return coreSplitScreenConfigurations.map(coreSplitScreenConfiguration => {
      return {
        id: coreSplitScreenConfiguration._id,
        name: coreSplitScreenConfiguration.DVEName,
        inputs: coreSplitScreenConfiguration.DVEInputs,
        layoutProperties: JSON.parse(coreSplitScreenConfiguration.DVEJSON),
        graphicsTemplateJson: coreSplitScreenConfiguration.DVEGraphicsTemplateJSON,
        key: coreSplitScreenConfiguration.DVEGraphicsKey,
        frame: coreSplitScreenConfiguration.DVEGraphicsFrame
      }
    })
  }

  private mapTransitionEffectConfigurations(transitions: string[]): BreakerTransitionEffect[] {
    return transitions.map(this.mapToVideoClipTransitionEffect)
  }

  private mapToVideoClipTransitionEffect(transition: string): BreakerTransitionEffect {
    return {
      type: TransitionEffectType.BREAKER,
      name: transition
    }
  }

  private mapToBreakers(coreBreakers?: CoreBreaker[]): Breaker[] {
    if(!coreBreakers) {
      return []
    }

    return coreBreakers.map(coreBreaker => {
      return {
        id: coreBreaker._id,
        name: coreBreaker.BreakerName,
        fileName: coreBreaker.ClipName,
        durationInFrames: coreBreaker.Duration,
        startAlpha: coreBreaker.StartAlpha,
        endAlpha: coreBreaker.EndAlpha,
        autoNext: coreBreaker.Autonext,
        shouldLoadFirstFrame: coreBreaker.LoadFirstFrame
      }
    })
  }
}
