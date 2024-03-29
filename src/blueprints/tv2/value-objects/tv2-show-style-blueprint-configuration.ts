import { PieceLifespan } from '../../../model/enums/piece-lifespan'

export interface Tv2ShowStyleBlueprintConfiguration {
  graphicsDefault: GraphicsDefault
  graphicsSetups: GraphicsSetup[]
  graphicsTemplates: GraphicsTemplate[]
  graphicsSchemas: GraphicsSchema[]
  selectedGraphicsSetup: GraphicsSetup
  splitScreenConfigurations: SplitScreenConfiguration[]
  breakerTransitionEffectConfigurations: BreakerTransitionEffect[]
  breakers: Breaker[]
}

export interface GraphicsDefault {
  setupName: { value: string; label: string }
  schema: { value: string; label: string }
  design: { value: string; label: string }
}

export interface GraphicsSetup {
  id: string
  name: string
  htmlPackageFolder: string
  overlayShowName?: string
  fullShowName?: string
}

export interface GraphicsTemplate {
  name: string
  lifespan: PieceLifespan
}

export interface GraphicsSchema {
  iNewsName: string
  iNewsSchemaColumn: string
  graphicsTemplateName: string
  casparCgDesignValues: CasparCgDesignValue[]
}

export interface CasparCgDesignValue {
  name: string
  properties: string[]
  backgroundLoop: string
}

export interface SplitScreenConfiguration {
  id: string
  name: string
  layoutProperties: SplitScreenLayoutProperties
  graphicsTemplateJson: string
  key: string
  frame: string
}

export interface SplitScreenLayoutProperties {
  boxes: {
    [key: number]: SplitScreenBoxProperties
  }
  index: number
  properties?: {
    artFillSource: number
    artCutSource: number
    artOption: number
    artPreMultiplied: boolean
    artClip: number
    artGain: number
    artInvertKey: boolean
  }
  border?: {
    borderEnabled: boolean
    borderBevel: number
    borderOuterWidth: number
    borderInnerWidth: number
    borderOuterSoftness: number
    borderInnerSoftness: number
    borderBevelSoftness: number
    borderBevelPosition: number
    borderHue: number
    borderSaturation: number
    borderLuma: number
    borderLightSourceDirection: number
    borderLightSourceAltitude: number
  }
}

export interface SplitScreenBoxProperties {
  enabled: boolean
  source: number
  x: number
  y: number
  size: number
  cropped: boolean
  cropTop: number
  cropBottom: number
  cropLeft: number
  cropRight: number
}

export interface BreakerTransitionEffect {
  type: TransitionEffectType.BREAKER
  name: string
}

export enum TransitionEffectType {
  CUT = 'CUT',
  MIX = 'MIX',
  DIP = 'DIP',
  BREAKER = 'BREAKER'
}

export interface Breaker {
  id: string
  name: string,
  fileName: string
  durationInFrames: number
  startAlpha: number
  endAlpha: number
  autoNext: boolean,
  shouldLoadFirstFrame: boolean
}
