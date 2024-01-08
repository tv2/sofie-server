import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, MutateActionMethods } from '../../model/entities/action'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2TransitionEffectActionFactory } from './action-factories/tv2-transition-effect-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2Action } from './value-objects/tv2-action'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2ActionManifest } from './value-objects/tv2-action-manifest'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'

export class Tv2ActionService implements BlueprintGenerateActions {
  constructor(
    private readonly configurationMapper: Tv2ConfigurationMapper,
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
    if (this.remoteActionFactory.isRemoteAction(action)) {
      return this.remoteActionFactory.getMutateActionMethods(action)
    }
    if (this.audioActionFactory.isAudioAction(action)) {
      return this.audioActionFactory.getMutateActionMethods(action)
    }
    return []
  }

  public generateActions(configuration: Configuration, actionManifests: Tv2ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration)

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.remoteActionFactory.createRemoteActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionEffectActionFactory.createTransitionEffectActions(blueprintConfiguration),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration, actionManifests),
      ...this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, actionManifests),
      ...this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration),
      ...this.splitScreenActionFactory.createSplitScreenActions(blueprintConfiguration, actionManifests),
      ...this.replayActionFactory.createReplayActions(blueprintConfiguration)
    ]
  }
}
