export interface Tv2ShowStyleBlueprintConfiguration {
  graphicsDefault: GraphicsDefault
  graphicsSetups: GraphicsSetup[]
  selectedGraphicsSetup: GraphicsSetup
  dveConfigurations: DveConfiguration[]
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

export interface DveConfiguration {
  id: string
  name: string
  layoutProperties: DveLayoutProperties
  graphicsTemplateJson: string
  key: string
  frame: string
}

export interface DveLayoutProperties {
  boxes: {
    [key: number]: DveBoxProperties
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

export interface DveBoxProperties {
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
