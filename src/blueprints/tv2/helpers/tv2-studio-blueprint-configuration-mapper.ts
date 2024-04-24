import { Studio } from '../../../model/entities/studio'
import {
  AudioBedSettings,
  Tv2DownstreamKeyerRole,
  Tv2FolderConfiguration,
  Tv2GraphicsType,
  Tv2HtmlGraphics,
  Tv2SourceMapping,
  Tv2SourceMappingWithSound,
  Tv2StudioBlueprintConfiguration,
  Tv2VideoMixerBasicConfiguration,
  Tv2VizPilotGraphics,
  VideoMixerType
} from '../value-objects/tv2-studio-blueprint-configuration'
import { DeviceType } from '../../../model/enums/device-type'

interface CoreStudioBlueprintConfiguration {
  SourcesCam: CoreSourceMappingWithSound[] // Cameras
  SourcesRM: CoreSourceMappingWithSound[] // Lives
  SourcesFeed: CoreSourceMappingWithSound[] // Feeds
  SourcesReplay: CoreSourceMappingWithSound[] // Replays
  StudioMics: string[]
  ABMediaPlayers: CoreMediaPlayer[]
  CasparPrerollDuration: number
  ServerPostrollDuration: number

  SwitcherType: string
  SwitcherSource: CoreVideoMixer

  DVEFolder?: string,
  DVEFileExtension: string
  DVEMediaFlowId: string
  DVEIgnoreStatus: boolean
  DVENetworkBasePath: string

  JingleFolder?: string
  JingleFileExtension: string
  JingleMediaFlowId: string
  JingleIgnoreStatus: boolean
  JingleNetworkBasePath: string

  GraphicFolder?: string
  GraphicFileExtension: string
  GraphicMediaFlowId: string
  GraphicIgnoreStatus: boolean
  GraphicNetworkBasePath: string

  GraphicsType: Tv2GraphicsType
  VizPilotGraphics: CoreVizGraphics
  HTMLGraphics?: CoreHtmlGraphics
  PreventOverlayWithFull: boolean

  AudioBedSettings: CoreAudioBedSettings
}

interface CoreSourceMapping {
  _id: string
  SourceName: string
  SwitcherSource: number
}

interface CoreMediaPlayer extends CoreSourceMapping { }

interface CoreSourceMappingWithSound extends CoreSourceMapping {
  SisyfosLayers: string[]
  StudioMics: boolean
  WantsToPersistAudio?: boolean
  AcceptPersistAudio?: boolean
}

interface CoreVideoMixer {
  Default: number
  SplitArtFill: number
  SplitArtKey: number
  DSK: CoreDownstreamKeyer[]
  Dip: number
}

interface CoreDownstreamKeyer {
  _id: string
  Number: number
  Key: number
  Fill: number
  DefaultOn: boolean
  Roles: CoreDownstreamKeyerRole[]
  Clip: number,
  Gain: number
}

enum CoreDownstreamKeyerRole {
  FULL_GRAPHICS = 'full_graphics',
  OVERLAY_GRAPHICS = 'overlay_graphics',
  JINGLE = 'jingle'
}

interface CoreVizGraphics {
  CleanFeedPrerollDuration?: number
  KeepAliveDuration: number
  PrerollDuration: number
  OutTransitionDuration: number
  CutToMediaPlayer: number
  FullGraphicBackground: number
}

interface CoreHtmlGraphics {
  KeepAliveDuration: number
  GraphicURL: string
  TransitionSettings: {
    wipeRate: number,
    borderSoftness: number
  }
}

interface CoreAudioBedSettings {
  fadeIn: number
  fadeOut: number
  volume: number
}

export class Tv2StudioBlueprintConfigurationMapper {

  public mapStudioConfiguration(studio: Studio): Tv2StudioBlueprintConfiguration {
    const coreConfiguration: CoreStudioBlueprintConfiguration = { ...(studio.blueprintConfiguration as CoreStudioBlueprintConfiguration) }
    return {
      cameraSources: this.mapSourcesWithSound(coreConfiguration.SourcesCam),
      remoteSources: this.mapSourcesWithSound(coreConfiguration.SourcesRM),
      feedSources: this.mapSourcesWithSound(coreConfiguration.SourcesFeed),
      replaySources: this.mapSourcesWithSound(coreConfiguration.SourcesReplay),
      studioMicrophones: coreConfiguration.StudioMics,
      mediaPlayers: this.mapSources(coreConfiguration.ABMediaPlayers),
      videoMixerType: this.mapToVideoMixerType(coreConfiguration.SwitcherType),
      videoMixerBasicConfiguration: this.mapVideoMixerBasicConfiguration(coreConfiguration.SwitcherSource),
      casparCgPreRollDuration: coreConfiguration.CasparPrerollDuration,
      serverPostRollDuration: coreConfiguration.ServerPostrollDuration,
      splitScreenFolder: this.mapSplitScreenFolder(coreConfiguration),
      jingleFolder: this.mapJingleFolder(coreConfiguration),
      graphicsFolder: this.mapGraphicsFolder(coreConfiguration),
      selectedGraphicsType: coreConfiguration.GraphicsType,
      vizPilotGraphics: this.mapVizPilotGraphics(coreConfiguration.VizPilotGraphics),
      htmlGraphics: coreConfiguration.HTMLGraphics ? this.mapHtmlGraphics(coreConfiguration.HTMLGraphics) : undefined,
      shouldPreventOverlayWhileFullscreenGraphicsIsOnAir: coreConfiguration.PreventOverlayWithFull,
      audioBedSettings: this.mapAudioBedSettings(coreConfiguration.AudioBedSettings)
    }
  }

  private mapSourcesWithSound(sources: CoreSourceMappingWithSound[] | undefined): Tv2SourceMappingWithSound[] {
    if (!sources) {
      return []
    }
    return sources.map(source => {
      return {
        id: source._id,
        name: source.SourceName,
        videoMixerSource: source.SwitcherSource,
        sisyfosLayers: source.SisyfosLayers,
        studioMicrophones: source.StudioMics,
        wantsToPersistAudio: source.WantsToPersistAudio,
        acceptPersistAudio: source.AcceptPersistAudio
      }
    })
  }

  private mapSources(sources: CoreSourceMapping[]): Tv2SourceMapping[] {
    return sources.map(source => {
      return {
        id: source._id,
        name: source.SourceName,
        videoMixerSource: source.SwitcherSource
      }
    })
  }

  private mapToVideoMixerType(rawVideoMixerType: string): VideoMixerType {
    switch(rawVideoMixerType) {
      case 'TRICASTER': {
        return DeviceType.TRICASTER
      }
      case 'ATEM':
      default: {
        return DeviceType.ATEM
      }
    }
  }

  private mapVideoMixerBasicConfiguration(coreVideoMixer: CoreVideoMixer): Tv2VideoMixerBasicConfiguration {
    return {
      defaultVideoMixerSource: coreVideoMixer.Default,
      splitScreenArtFillSource: coreVideoMixer.SplitArtFill,
      splitScreenArtKeySource: coreVideoMixer.SplitArtKey,
      dipVideoMixerSource: coreVideoMixer.Dip,
      downstreamKeyers: coreVideoMixer.DSK.map(dsk => {
        return {
          id: dsk._id,
          index: dsk.Number,
          videoMixerKeySource: dsk.Key,
          videoMixerFillSource: dsk.Fill,
          videoMixerClip: dsk.Clip,
          videoMixerGain: dsk.Gain,
          defaultOn: dsk.DefaultOn,
          roles: dsk.Roles.map(this.mapDownstreamKeyerRole)
        }
      })
    }
  }

  private mapDownstreamKeyerRole(coreRole: CoreDownstreamKeyerRole): Tv2DownstreamKeyerRole {
    switch (coreRole) {
      case CoreDownstreamKeyerRole.FULL_GRAPHICS: {
        return Tv2DownstreamKeyerRole.FULL_GRAPHICS
      }
      case CoreDownstreamKeyerRole.OVERLAY_GRAPHICS: {
        return Tv2DownstreamKeyerRole.OVERLAY_GRAPHICS
      }
      case CoreDownstreamKeyerRole.JINGLE: {
        return Tv2DownstreamKeyerRole.JINGLE
      }
    }
  }

  private mapSplitScreenFolder(coreConfiguration: CoreStudioBlueprintConfiguration): Tv2FolderConfiguration {
    return {
      name: coreConfiguration.DVEFolder,
      fileExtension: coreConfiguration.DVEFileExtension,
      mediaFlowId: coreConfiguration.DVEMediaFlowId,
      networkBasePath: coreConfiguration.DVENetworkBasePath,
      ignoreMediaStatus: coreConfiguration.DVEIgnoreStatus
    }
  }

  private mapJingleFolder(coreConfiguration: CoreStudioBlueprintConfiguration): Tv2FolderConfiguration {
    return {
      name: coreConfiguration.JingleFolder,
      fileExtension: coreConfiguration.JingleFileExtension,
      mediaFlowId: coreConfiguration.JingleMediaFlowId,
      networkBasePath: coreConfiguration.JingleNetworkBasePath,
      ignoreMediaStatus: coreConfiguration.JingleIgnoreStatus
    }
  }

  private mapGraphicsFolder(coreConfiguration: CoreStudioBlueprintConfiguration): Tv2FolderConfiguration {
    return {
      name: coreConfiguration.GraphicFolder,
      fileExtension: coreConfiguration.GraphicFileExtension,
      mediaFlowId: coreConfiguration.GraphicMediaFlowId,
      networkBasePath: coreConfiguration.GraphicNetworkBasePath,
      ignoreMediaStatus: coreConfiguration.GraphicIgnoreStatus
    }
  }

  private mapVizPilotGraphics(coreGraphics: CoreVizGraphics): Tv2VizPilotGraphics {
    return {
      preRollDurationInMsForCleanFeed: coreGraphics.CleanFeedPrerollDuration,
      keepPreviousPartAliveDurationInMs: coreGraphics.KeepAliveDuration,
      preRollDurationInMs: coreGraphics.PrerollDuration,
      outTransitionDurationInMs: coreGraphics.OutTransitionDuration,
      fullscreenGraphicsBackgroundStartOffsetInMs: coreGraphics.CutToMediaPlayer,
      videoMixerSourceForFullscreenGraphicsBackground: coreGraphics.FullGraphicBackground
    }
  }

  private mapHtmlGraphics(coreGraphics: CoreHtmlGraphics): Tv2HtmlGraphics {
    return  {
      msKeepOldPartAliveBeforeTakingGraphics: coreGraphics.KeepAliveDuration,
      graphicsUrl: coreGraphics.GraphicURL,
      transitionSettings: {
        wipeRate: coreGraphics.TransitionSettings ? coreGraphics.TransitionSettings.wipeRate : 0,
        borderSoftness: coreGraphics.TransitionSettings ? coreGraphics.TransitionSettings.borderSoftness: 0
      }
    }
  }

  private mapAudioBedSettings(coreAudioBed: CoreAudioBedSettings): AudioBedSettings {
    return {
      fadeInDurationFrames: coreAudioBed.fadeIn,
      fadeOutDurationInFrames: coreAudioBed.fadeOut,
      volume: coreAudioBed.volume
    }
  }
}
