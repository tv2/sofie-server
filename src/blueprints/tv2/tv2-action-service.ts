import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, ActionManifest, MutateActionMethods } from '../../model/entities/action'
import { Tv2StudioBlueprintConfiguration } from './value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2TransitionActionFactory } from './action-factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import { Tv2ActionManifestData, Tv2VideoClipData } from './value-objects/tv2-video-clip-data'
import { PieceType } from '../../model/enums/piece-type'
import { Tv2DveActionFactory } from './action-factories/tv2-dve-action-factory'
import { Tv2BlueprintConfigurationMapper } from './helpers/tv2-blueprint-configuration-mapper'

export class Tv2ActionService implements BlueprintGenerateActions {
  constructor(
    private readonly configurationMapper: Tv2BlueprintConfigurationMapper,
    private readonly cameraActionFactory: Tv2CameraActionFactory,
    private readonly transitionActionFactory: Tv2TransitionActionFactory,
    private readonly audioActionFactory: Tv2AudioActionFactory,
    private readonly graphicsActionFactory: Tv2GraphicsActionFactory,
    private readonly serverActionFactory: Tv2VideoClipActionFactory,
    private readonly videoSwitcherActionFactory: Tv2VideoMixerConfigurationActionFactory,
    private readonly dveActionFactory: Tv2DveActionFactory
  ) {}

  public getMutateActionMethods(action: Action): MutateActionMethods | undefined {
    if (this.transitionActionFactory.isTransitionAction(action)) {
      return this.transitionActionFactory.getMutateActionMethods(action)
    }
    if (this.serverActionFactory.isVideoClipAction(action)) {
      return this.serverActionFactory.getMutateActionMethods(action)
    }
    if (this.dveActionFactory.isDveAction(action)) {
      return this.dveActionFactory.getMutateActionMethods(action)
    }
  }

  public generateActions(configuration: Configuration, actionManifests: ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = {
      studio: configuration.studio.blueprintConfiguration as Tv2StudioBlueprintConfiguration,
      showStyle: this.configurationMapper.mapShowStyleConfiguration(configuration.showStyle)
    }

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionActionFactory.createTransitionActions(),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration),
      ...this.serverActionFactory.createVideoClipActions(blueprintConfiguration, this.getVideoClipData(actionManifests)),
      ...this.videoSwitcherActionFactory.createVideoMixerActions(blueprintConfiguration),
      ...this.dveActionFactory.createDveActions(blueprintConfiguration)
    ]
  }

  private getVideoClipData(actionManifests: ActionManifest[]): Tv2VideoClipData[] {
    return actionManifests
      .filter(actionManifest => actionManifest.pieceType === PieceType.VIDEO_CLIP)
      .map(actionManifest => {
        const data: Tv2ActionManifestData = actionManifest.data as Tv2ActionManifestData
        return {
          name: data.partDefinition.storyName,
          fileName: data.partDefinition.fields.videoId,
          durationFromIngest: data.duration,
          adLibPix: data.adLibPix,
          isVoiceOver: data.voLevels
        }
      })
  }
}
