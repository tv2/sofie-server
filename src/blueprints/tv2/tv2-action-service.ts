import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest, MutateActionMethods } from '../../model/entities/action'
import {
  Tv2SourceMappingWithSound,
  Tv2StudioBlueprintConfiguration
} from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2TransitionEffectActionFactory } from './action-factories/tv2-transition-effect-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import {
  SplitScreenBoxInput,
  Tv2ActionManifestData,
  Tv2ActionManifestDataForSplitScreen,
  Tv2ActionManifestDataForVideoClip,
  Tv2ActionManifestSplitScreenSource,
  Tv2SplitScreenManifestData,
  Tv2VideoClipManifestData,
  TvActionManifestSplitScreenSourceType
} from './value-objects/tv2-action-manifest-data'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2BlueprintConfigurationMapper } from './helpers/tv2-blueprint-configuration-mapper'
import { MisconfigurationException } from '../../model/exceptions/misconfiguration-exception'
import { Tv2Action } from './value-objects/tv2-action'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2PieceType } from './enums/tv2-piece-type'
import { Tv2ActionManifest } from './value-objects/tv2-action-manifest'
import { UnexpectedCaseException } from '../../model/exceptions/unexpected-case-exception'
import { Tv2AudioMode } from './enums/tv2-audio-mode'

export class Tv2ActionService implements BlueprintGenerateActions {
  constructor(
    private readonly configurationMapper: Tv2BlueprintConfigurationMapper,
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly remoteActionFactory: Tv2RemoteActionFactory,
    private readonly transitionEffectActionFactory: Tv2TransitionEffectActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly graphicsActionFactory: Tv2GraphicsActionFactory,
    private readonly videoClipActionFactory: Tv2VideoClipActionFactory,
    private readonly videoMixerActionFactory: Tv2VideoMixerConfigurationActionFactory,
    private readonly splitScreenActionFactory: Tv2SplitScreenActionFactory,
    private readonly replayActionFactory: Tv2ReplayActionFactory
  ) {}

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (this.transitionEffectActionFactory.isTransitionEffectAction(action)) {
      return this.transitionEffectActionFactory.getMutateActionMethods(action)
    }
    if (this.videoClipActionFactory.isVideoClipAction(action)) {
      return this.videoClipActionFactory.getMutateActionMethods(action)
    }
    if (this.splitScreenActionFactory.isSplitScreenAction(action)) {
      return this.splitScreenActionFactory.getMutateActionMethods(action)
    }
    return []
  }

  public generateActions(configuration: Configuration, actionManifests: Tv2ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.configurationMapper.mapShowStyleConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.remoteActionFactory.createRemoteActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionEffectActionFactory.createTransitionEffectActions(blueprintConfiguration),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration),
      ...this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, this.getVideoClipData(actionManifests)),
      ...this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration),
      ...this.splitScreenActionFactory.createSplitScreenActions(blueprintConfiguration, this.getSplitScreenData(blueprintConfiguration, actionManifests)),
      ...this.replayActionFactory.createReplayActions(blueprintConfiguration)
    ]
  }

  private getVideoClipData(actionManifests: ActionManifest<Tv2ActionManifestData>[]): Tv2VideoClipManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestDataForVideoClip> => this.getPieceTypeFromActionManifest(actionManifest) === Tv2PieceType.VIDEO_CLIP)
      .map(actionManifest => {
        const data: Tv2ActionManifestDataForVideoClip = actionManifest.data
        return {
          name: data.partDefinition.storyName,
          fileName: data.partDefinition.fields.videoId,
          durationFromIngest: data.duration,
          adLibPix: data.adLibPix,
          audioMode: data.voLevels ? Tv2AudioMode.VOICE_OVER : Tv2AudioMode.FULL
        }
      })
  }

  private getPieceTypeFromActionManifest(actionManifest: ActionManifest): Tv2PieceType {
    switch (actionManifest.actionId) {
      case 'select_full_grafik': {
        return Tv2PieceType.CAMERA
      }
      case 'select_server_clip': {
        return Tv2PieceType.VIDEO_CLIP
      }
      case 'select_dve': {
        return Tv2PieceType.SPLIT_SCREEN
      }
      default: {
        throw new UnexpectedCaseException(`Unknown action manifest id: ${actionManifest.actionId}`)
      }
    }
  }

  private getSplitScreenData(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: ActionManifest[]): Tv2SplitScreenManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestDataForSplitScreen> => this.getPieceTypeFromActionManifest(actionManifest) === Tv2PieceType.SPLIT_SCREEN)
      .map(actionManifest => {
        const data: Tv2ActionManifestDataForSplitScreen = actionManifest.data
        const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = this.getSplitScreenSourcesFromActionManifestData(data, blueprintConfiguration)
        return {
          name: data.name,
          template: data.config.template,
          sources
        }
      })
  }

  private getSplitScreenSourcesFromActionManifestData(data: Tv2ActionManifestDataForSplitScreen, blueprintConfiguration: Tv2BlueprintConfiguration): Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> {
    const sources: Map<SplitScreenBoxInput, Tv2SourceMappingWithSound> = new Map()
    if (data.config.sources.INP1) {
      sources.set(SplitScreenBoxInput.INPUT_1, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP1))
    }
    if (data.config.sources.INP2) {
      sources.set(SplitScreenBoxInput.INPUT_2, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP2))
    }
    if (data.config.sources.INP3) {
      sources.set(SplitScreenBoxInput.INPUT_3, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP3))
    }
    if (data.config.sources.INP4) {
      sources.set(SplitScreenBoxInput.INPUT_4, this.mapActionManifestSplitScreenSourceToSource(blueprintConfiguration, data.config.sources.INP4))
    }
    return sources
  }

  private mapActionManifestSplitScreenSourceToSource(blueprintConfiguration: Tv2BlueprintConfiguration, splitScreenSource: Tv2ActionManifestSplitScreenSource): Tv2SourceMappingWithSound {
    let sources: Tv2SourceMappingWithSound[] = []
    switch (splitScreenSource.sourceType) {
      case TvActionManifestSplitScreenSourceType.CAMERA: {
        sources = blueprintConfiguration.studio.SourcesCam
        break
      }
      case TvActionManifestSplitScreenSourceType.LIVE: {
        sources = blueprintConfiguration.studio.SourcesRM
        break
      }
    }
    const source: Tv2SourceMappingWithSound | undefined = sources.find(source => source.SourceName === splitScreenSource.id)
    if (!source) {
      throw new MisconfigurationException(`No Source Mapping found for split screen source ${splitScreenSource.sourceType} ${splitScreenSource.id}`)
    }
    return source
  }
}
