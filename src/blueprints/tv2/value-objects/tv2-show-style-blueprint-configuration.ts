export interface Tv2ShowStyleBlueprintConfiguration {
  GfxDefaults: GraphicDefault
  GfxSetups: GraphicSetup[]
  selectedGraphicSetup: GraphicSetup
}

export interface GraphicDefault {
  DefaultSetupName: { value: string; label: string }
  DefaultSchema: { value: string; label: string }
  DefaultDesign: { value: string; label: string }
}

export interface GraphicSetup {
  _id: string
  Name: string
  HtmlPackageFolder: string
  OvlShowName?: string
  FullShowName?: string
}