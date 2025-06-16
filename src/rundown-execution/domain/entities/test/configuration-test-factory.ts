import { Configuration } from '../configuration'
import { ShowStyle } from '../show-style'
import { Studio } from '../studio'

export class ConfigurationTestFactory {
  public static createConfiguration(blueprintConfiguration: Partial<{ studio: Partial<Studio>, showStyle: Partial<ShowStyle> }> = {}): Configuration {
    return {
      studio: this.createStudio(blueprintConfiguration.studio),
      showStyle: this.createShowStyle(blueprintConfiguration.showStyle),
    }
  }

  public static createStudio(studio: Partial<Studio> = {}): Studio {
    return {
      blueprintConfiguration: {},
      layers: [],
      settings: {
        mediaPreviewUrl: '',
      },
      ...studio,
    }
  }

  public static createShowStyle(showStyle: Partial<ShowStyle> = {}): ShowStyle {
    return {
      blueprintConfiguration: {},
      variants: [],
      ...showStyle
    }
  }
}
