export interface Tv2ShowStyleBlueprintConfiguration {
  GfxDefaults: GraphicsDefault
  GfxSetups: GraphicsSetup[]
  selectedGraphicsSetup: GraphicsSetup
}

export interface GraphicsDefault {
  DefaultSetupName: { value: string; label: string }
  DefaultSchema: { value: string; label: string }
  DefaultDesign: { value: string; label: string }
}

export interface GraphicsSetup {
  _id: string
  Name: string
  HtmlPackageFolder: string
  OvlShowName?: string
  FullShowName?: string
}