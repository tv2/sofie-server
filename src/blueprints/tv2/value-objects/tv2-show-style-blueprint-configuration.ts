import { PieceLifespan } from '../../../model/enums/piece-lifespan'

export interface Tv2ShowStyleBlueprintConfiguration {
  graphicsDefault: GraphicsDefault
  graphicsSetups: GraphicsSetup[]
  graphicsTemplates: GraphicsTemplate[]
  selectedGraphicsSetup: GraphicsSetup
  splitScreenConfigurations: SplitScreenConfiguration[]
  transitionEffectConfigurations: TransitionEffect[]
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

export type TransitionEffect = CutTransitionEffect | MixTransitionEffect | DipTransitionEffect | BreakerTransitionEffect

export interface CutTransitionEffect {
  type: TransitionEffectType.CUT
}

export interface MixTransitionEffect {
  type: TransitionEffectType.MIX
  durationInFrames: number
}

export interface DipTransitionEffect {
  type: TransitionEffectType.DIP
  durationInFrames: number
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
