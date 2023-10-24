export interface Tv2ShowStyleBlueprintConfiguration {
  graphicsDefault: GraphicsDefault
  graphicsSetups: GraphicsSetup[]
  selectedGraphicsSetup: GraphicsSetup
  dveConfigs: DveConfiguration[]
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
  inputs: string
  json: string
  graphicsTemplateJson: string
  key: string
  frame: string
}
