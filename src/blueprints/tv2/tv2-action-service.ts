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
  DveBoxInput,
  Tv2ActionManifestDataForDve,
  Tv2ActionManifestDataForVideoClip,
  Tv2ActionManifestDveSource,
  Tv2DveManifestData,
  Tv2VideoClipManifestData,
  TvActionManifestDveSourceType
} from './value-objects/tv2-action-manifest-data'
import { PieceType } from '../../model/enums/piece-type'
import { Tv2DveActionFactory } from './action-factories/tv2-dve-action-factory'
import { Tv2BlueprintConfigurationMapper } from './helpers/tv2-blueprint-configuration-mapper'
import { MisconfigurationException } from '../../model/exceptions/misconfiguration-exception'
import { Tv2Action } from './value-objects/tv2-action'

export class Tv2ActionService implements BlueprintGenerateActions {
  constructor(
    private readonly configurationMapper: Tv2BlueprintConfigurationMapper,
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionEffectActionFactory: Tv2TransitionEffectActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly graphicsActionFactory: Tv2GraphicsActionFactory,
    private readonly videoClipActionFactory: Tv2VideoClipActionFactory,
    private readonly videoMixerActionFactory: Tv2VideoMixerConfigurationActionFactory,
    private readonly dveActionFactory: Tv2DveActionFactory
  ) {}

  public getMutateActionMethods(action: Tv2Action): MutateActionMethods[] {
    if (this.transitionEffectActionFactory.isTransitionEffectAction(action)) {
      return this.transitionEffectActionFactory.getMutateActionMethods(action)
    }
    if (this.videoClipActionFactory.isVideoClipAction(action)) {
      return this.videoClipActionFactory.getMutateActionMethods(action)
    }
    if (this.dveActionFactory.isDveAction(action)) {
      return this.dveActionFactory.getMutateActionMethods(action)
    }
    return []
  }

  public generateActions(configuration: Configuration, actionManifests: ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.configurationMapper.mapShowStyleConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionEffectActionFactory.createTransitionEffectActions(blueprintConfiguration),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration),
      ...this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, this.getVideoClipData(actionManifests)),
      ...this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration),
      ...this.dveActionFactory.createDveActions(blueprintConfiguration, this.getDveData(blueprintConfiguration, actionManifests))
    ]
  }

  private getVideoClipData(actionManifests: ActionManifest[]): Tv2VideoClipManifestData[] {
    return actionManifests
      .filter(actionManifest => actionManifest.pieceType === PieceType.VIDEO_CLIP)
      .map(actionManifest => {
        const data: Tv2ActionManifestDataForVideoClip = actionManifest.data as Tv2ActionManifestDataForVideoClip
        return {
          name: data.partDefinition.storyName,
          fileName: data.partDefinition.fields.videoId,
          durationFromIngest: data.duration,
          adLibPix: data.adLibPix,
          isVoiceOver: data.voLevels
        }
      })
  }

  private getDveData(blueprintConfiguration: Tv2BlueprintConfiguration, actionManifests: ActionManifest[]): Tv2DveManifestData[] {
    return actionManifests
      .filter((actionManifest): actionManifest is ActionManifest<Tv2ActionManifestDataForDve> => actionManifest.pieceType === PieceType.DVE)
      .map(actionManifest => {
        const data: Tv2ActionManifestDataForDve = actionManifest.data
        const sources: Map<DveBoxInput, Tv2SourceMappingWithSound> = this.getDveSourcesFromActionManifestData(data, blueprintConfiguration)
        return {
          name: data.name,
          template: data.config.template,
          sources
        }
      })
  }

  private getDveSourcesFromActionManifestData(data: Tv2ActionManifestDataForDve, blueprintConfiguration: Tv2BlueprintConfiguration): Map<DveBoxInput, Tv2SourceMappingWithSound> {
    const sources: Map<DveBoxInput, Tv2SourceMappingWithSound> = new Map()
    if (data.config.sources.INP1) {
      sources.set(DveBoxInput.INPUT_1, this.mapActionManifestDveSourceToSource(blueprintConfiguration, data.config.sources.INP1))
    }
    if (data.config.sources.INP2) {
      sources.set(DveBoxInput.INPUT_2, this.mapActionManifestDveSourceToSource(blueprintConfiguration, data.config.sources.INP2))
    }
    if (data.config.sources.INP3) {
      sources.set(DveBoxInput.INPUT_3, this.mapActionManifestDveSourceToSource(blueprintConfiguration, data.config.sources.INP3))
    }
    if (data.config.sources.INP4) {
      sources.set(DveBoxInput.INPUT_4, this.mapActionManifestDveSourceToSource(blueprintConfiguration, data.config.sources.INP4))
    }
    return sources
  }

  private mapActionManifestDveSourceToSource(blueprintConfiguration: Tv2BlueprintConfiguration, dveSource: Tv2ActionManifestDveSource): Tv2SourceMappingWithSound {
    let sources: Tv2SourceMappingWithSound[] = []
    switch (dveSource.sourceType) {
      case TvActionManifestDveSourceType.CAMERA: {
        sources = blueprintConfiguration.studio.SourcesCam
        break
      }
      case TvActionManifestDveSourceType.LIVE: {
        sources = blueprintConfiguration.studio.SourcesRM
        break
      }
    }
    const source: Tv2SourceMappingWithSound | undefined = sources.find(source => source.SourceName === dveSource.id)
    if (!source) {
      throw new MisconfigurationException(`No Source Mapping found for DVE source ${dveSource.sourceType} ${dveSource.id}`)
    }
    return source
  }
}
