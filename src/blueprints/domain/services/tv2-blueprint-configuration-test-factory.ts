import { Tv2ShowStyleBlueprintConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import {
  Tv2GraphicsType,
  Tv2StudioBlueprintConfiguration,
} from '../value-objects/tv2-studio-blueprint-configuration'
import { DeviceType } from '../../../rundown-execution/domain/enums/device-type'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'

export class Tv2BlueprintConfigurationTestFactory {

  public static createTv2BlueprintConfiguration(blueprintConfiguration: Partial<{ studio: Partial<Tv2StudioBlueprintConfiguration>, showStyle: Partial<Tv2ShowStyleBlueprintConfiguration> }> = {}): Tv2BlueprintConfiguration {
    return {
      studio: this.createTv2StudioBlueprintConfiguration(blueprintConfiguration.studio),
      showStyle: this.createTv2ShowStyleBlueprintConfiguration(blueprintConfiguration.showStyle),
    }
  }

  public static createTv2ShowStyleBlueprintConfiguration(showStyleBlueprintConfiguration: Partial<Tv2ShowStyleBlueprintConfiguration> = {}): Tv2ShowStyleBlueprintConfiguration {
    return {
      audioBedConfigurations: [],
      breakerTransitionEffectConfigurations: [],
      breakers: [],
      graphicsDefault: {
        setupName: { value: '', label: '' },
        schema: { value: '', label: '' },
        design: { value: '', label: '' },
      },
      graphicsSchemas: [],
      graphicsSetups: [],
      graphicsTemplates: [],
      selectedGraphicsSetup: {
        id: '',
        name: '',
        htmlPackageFolder: '',
      },
      splitScreenConfigurations: [],
      ...showStyleBlueprintConfiguration,
    }
  }

  public static createTv2StudioBlueprintConfiguration(studioBlueprintConfiguration: Partial<Tv2StudioBlueprintConfiguration> = {}): Tv2StudioBlueprintConfiguration {
    return {
      audioBedSettings: {
        mediaDirectory: 'audio',
        fadeInDurationFrames: 0,
        fadeOutDurationInFrames: 0,
        volume: 100
      },
      cameraSources: [],
      casparCgPreRollDuration: 0,
      feedSources: [],
      graphicsFolder: {
        networkBasePath: '',
        fileExtension: '',
        mediaFlowId: '',
        ignoreMediaStatus: false,
      },
      mediaPlayers: [],
      remoteSources: [],
      replaySources: [],
      selectedGraphicsType: Tv2GraphicsType.HTML,
      serverPostRollDuration: 0,
      shouldPreventOverlayWhileFullscreenGraphicsIsOnAir: false,
      studioMicrophones: [],
      videoMixerBasicConfiguration: {
        defaultVideoMixerSource: 0,
        splitScreenArtFillSource: 1,
        splitScreenArtKeySource: 2,
        downstreamKeyers: [],
        dipVideoMixerSource: 3,
      },
      videoMixerType: DeviceType.ATEM,
      vizPilotGraphics: {
        keepPreviousPartAliveDurationInMs: 0,
        preRollDurationInMs: 0,
        outTransitionDurationInMs: 0,
        fullscreenGraphicsBackgroundStartOffsetInMs: 0,
        videoMixerSourceForFullscreenGraphicsBackground: 0,
      },
      ...studioBlueprintConfiguration,
    }
  }
}
