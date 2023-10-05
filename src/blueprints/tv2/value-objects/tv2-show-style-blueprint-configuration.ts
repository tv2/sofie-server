export interface Tv2ShowStyleBlueprintConfiguration {
  GfxDefaults: GfxDefault
  GfxSetups: GfxSetup[]
  selectedGraphicsSetup: GfxSetup
}

export interface GfxDefault {
  DefaultSetupName: { value: string; label: string }
  DefaultSchema: { value: string; label: string }
  DefaultDesign: { value: string; label: string }
}

export interface GfxSetup {
  _id: string
  Name: string
  HtmlPackageFolder: string
  OvlShowName?: string
  FullShowName?: string
}