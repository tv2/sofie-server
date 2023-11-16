import {
  Breaker,
  CutTransitionEffect,
  DipTransitionEffect,
  SplitScreenConfiguration,
  GraphicsDefault,
  GraphicsSetup,
  GraphicsTemplate,
  MixTransitionEffect,
  TransitionEffect,
  TransitionEffectType,
  Tv2ShowStyleBlueprintConfiguration,
  BreakerTransitionEffect
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { ShowStyle } from '../../../model/entities/show-style'

const CUT_TRANSITION_EFFECT_REGEX: RegExp = /cut/i
const MIX_TRANSITION_EFFECT_REGEX: RegExp = /mix ?(\d+)/i
const DIP_TRANSITION_EFFECT_REGEX: RegExp = /dip ?(\d+)/i

interface CoreShowStyleBlueprintConfiguration {
  GfxDefaults: CoreGraphicsDefault[]
  GfxSetups: CoreGraphicsSetup[]
  GfxTemplates: CoreGraphicsTemplate[]
  DVEStyles: CoreSplitScreenConfiguration[]
  BreakerConfig: CoreBreaker[]
  Transitions: { _id: string, Transition: string }[]
  ShowstyleTransition: string
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
  VizTemplate?: string
  OutType?: string
  INewsName?: string
  LayerMapping: string
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

export class Tv2BlueprintConfigurationMapper {
  public mapShowStyleConfiguration(showStyle: ShowStyle): Tv2ShowStyleBlueprintConfiguration {
    const coreConfiguration: CoreShowStyleBlueprintConfiguration = { ...(showStyle.blueprintConfiguration as CoreShowStyleBlueprintConfiguration) }
    return {
      graphicsDefault: this.mapGraphicsDefault(coreConfiguration.GfxDefaults),
      graphicsSetups: this.mapGraphicsSetups(coreConfiguration.GfxSetups),
      graphicsTemplates: this.mapGraphicsTemplates(coreConfiguration.GfxTemplates),
      selectedGraphicsSetup: this.findSelectedGraphicsSetup(coreConfiguration.GfxDefaults, coreConfiguration.GfxSetups),
      splitScreenConfigurations: this.mapSplitScreenConfigurations(coreConfiguration.DVEStyles),
      transitionEffectConfigurations: this.mapTransitionEffectConfigurations([
        ...coreConfiguration.Transitions.map(transition => transition.Transition),
        coreConfiguration.ShowstyleTransition
      ]),
      breakers: this.mapToBreakers(coreConfiguration.BreakerConfig)
    }
  }

  private mapGraphicsDefault(coreGraphicsDefaults: CoreGraphicsDefault[]): GraphicsDefault {
    return {
      setupName: coreGraphicsDefaults[0].DefaultSetupName,
      schema: coreGraphicsDefaults[0].DefaultSchema,
      design: coreGraphicsDefaults[0].DefaultDesign
    }
  }

  private mapGraphicsSetups(coreGraphicsSetups: CoreGraphicsSetup[]): GraphicsSetup[] {
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

  private mapGraphicsTemplates(coreGraphicsTemplates: CoreGraphicsTemplate[]): GraphicsTemplate[] {
    return coreGraphicsTemplates.map(template => {
      return {
        vizTemplate: template.VizTemplate,
        outType: template.OutType,
        iNewsName: template.INewsName,
        layerMapping: template.LayerMapping,
      }
    })
  }

  private findSelectedGraphicsSetup(coreGraphicsDefaults: CoreGraphicsDefault[], coreGraphicsSetups: CoreGraphicsSetup[]): GraphicsSetup {
    const selectedGraphicsSetup: CoreGraphicsSetup | undefined = coreGraphicsSetups.find(setup => setup._id === coreGraphicsDefaults[0].DefaultSetupName.value)
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

  private mapSplitScreenConfigurations(coreSplitScreenConfigurations: CoreSplitScreenConfiguration[]): SplitScreenConfiguration[] {
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

  private mapTransitionEffectConfigurations(transitions: string[]): TransitionEffect[] {
    return transitions.map(transition => {
      if (transition.match(CUT_TRANSITION_EFFECT_REGEX)) {
        return this.mapToCutTransitionEffect()
      }
      if (transition.match(MIX_TRANSITION_EFFECT_REGEX)) {
        return this.mapToMixTransitionEffect(transition)
      }
      if (transition.match(DIP_TRANSITION_EFFECT_REGEX)) {
        return this.mapToDipTransitionEffect(transition)
      }
      return this.mapToVideoClipTransitionEffect(transition)
    })
  }

  private mapToCutTransitionEffect(): CutTransitionEffect {
    return {
      type: TransitionEffectType.CUT,
    }
  }

  private mapToMixTransitionEffect(transition: string): MixTransitionEffect {
    return {
      type: TransitionEffectType.MIX,
      durationInFrames: this.getDurationFromTransition(transition, MIX_TRANSITION_EFFECT_REGEX)
    }
  }

  private getDurationFromTransition(transition: string, regex: RegExp): number {
    const transitionProperties: RegExpMatchArray | null = transition.match(regex)
    return Number(transitionProperties![1])
  }

  private mapToDipTransitionEffect(transition: string): DipTransitionEffect {
    return {
      type: TransitionEffectType.DIP,
      durationInFrames: this.getDurationFromTransition(transition, DIP_TRANSITION_EFFECT_REGEX)
    }
  }

  private mapToVideoClipTransitionEffect(transition: string): BreakerTransitionEffect {
    return {
      type: TransitionEffectType.BREAKER,
      name: transition
    }
  }

  private mapToBreakers(coreBreakers: CoreBreaker[]): Breaker[] {
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
