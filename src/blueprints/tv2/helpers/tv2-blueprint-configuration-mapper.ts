import {
  DveConfiguration,
  GraphicsDefault, GraphicsSetup,
  Tv2ShowStyleBlueprintConfiguration
} from '../value-objects/tv2-show-style-blueprint-configuration'
import { ShowStyle } from '../../../model/entities/show-style'

interface CoreShowStyleBlueprintConfiguration {
  GfxDefaults: CoreGraphicsDefault[]
  GfxSetups: CoreGraphicsSetup[]
  DVEStyles: CoreDveStyle[]
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

interface CoreDveStyle {
  _id: string
  DVEName: string
  DVEInputs: string
  DVEJSON: string
  DVEGraphicsTemplateJSON: string
  DVEGraphicsKey: string
  DVEGraphicsFrame: string
}

export class Tv2BlueprintConfigurationMapper {
  public mapShowStyleConfiguration(showStyle: ShowStyle): Tv2ShowStyleBlueprintConfiguration {
    const coreConfiguration: CoreShowStyleBlueprintConfiguration = { ...(showStyle.blueprintConfiguration as CoreShowStyleBlueprintConfiguration) }
    return {
      graphicsDefault: this.mapGraphicsDefault(coreConfiguration.GfxDefaults),
      graphicsSetups: this.mapGraphicsSetups(coreConfiguration.GfxSetups),
      selectedGraphicsSetup: this.findSelectedGraphicsSetup(coreConfiguration.GfxDefaults, coreConfiguration.GfxSetups),
      dveConfigurations: this.mapDveConfigurations(coreConfiguration.DVEStyles)
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

  private mapDveConfigurations(coreDveStyles: CoreDveStyle[]): DveConfiguration[] {
    return coreDveStyles.map(dveStyle => {
      return {
        id: dveStyle._id,
        name: dveStyle.DVEName,
        inputs: dveStyle.DVEInputs,
        layoutProperties: JSON.parse(dveStyle.DVEJSON),
        graphicsTemplateJson: dveStyle.DVEGraphicsTemplateJSON,
        key: dveStyle.DVEGraphicsKey,
        frame: dveStyle.DVEGraphicsFrame
      }
    })
  }
}
