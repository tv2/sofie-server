import { BlueprintGenerateActions } from '../../model/value-objects/blueprint'
import { Configuration } from '../../model/entities/configuration'
import { Action, MutateActionMethods } from '../../model/entities/action'
import { Tv2BlueprintConfiguration } from './value-objects/tv2-blueprint-configuration'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2Action } from './value-objects/tv2-action'
import { Tv2ActionManifest } from './value-objects/tv2-action-manifest'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import { Tv2ActionFactoryProvider } from './action-factories/tv2-action-factory-provider'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2TransitionEffectActionFactory } from './action-factories/tv2-transition-effect-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'
import { Tv2RobotActionFactory } from './action-factories/tv2-robot-action-factory'

export class Tv2ActionService implements BlueprintGenerateActions {

  private static instance: Tv2ActionService

  public static getInstance(
    configurationMapper: Tv2ConfigurationMapper,
    actionFactoryProvider: Tv2ActionFactoryProvider
  ): Tv2ActionService {
    if (!this.instance) {
      this.instance = new Tv2ActionService(configurationMapper, actionFactoryProvider)
    }
    return this.instance
  }

  private cameraActionFactory: Tv2CameraActionFactory
  private remoteActionFactory: Tv2RemoteActionFactory
  private audioActionFactory: Tv2AudioActionFactory
  private transitionEffectActionFactory: Tv2TransitionEffectActionFactory
  private graphicsActionFactory: Tv2GraphicsActionFactory
  private videoClipActionFactory: Tv2VideoClipActionFactory
  private videoMixerActionFactory: Tv2VideoMixerConfigurationActionFactory
  private splitScreenActionFactory: Tv2SplitScreenActionFactory
  private replayActionFactory: Tv2ReplayActionFactory
  private robotActionFactory: Tv2RobotActionFactory

  private constructor(
    private readonly configurationMapper: Tv2ConfigurationMapper,
    private readonly actionFactoryProvider: Tv2ActionFactoryProvider
  ) {
    this.setFactories()
  }

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
    if (this.robotActionFactory.isRobotAction(action)) {
      return this.robotActionFactory.getMutateActionMethods(action)
    }
    return []
  }

  public generateActions(configuration: Configuration, showStyleVariantId: string, actionManifests: Tv2ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration, showStyleVariantId)
    this.setFactories(blueprintConfiguration)

    return [
      ...this.cameraActionFactory.createCameraActions(blueprintConfiguration),
      ...this.remoteActionFactory.createRemoteActions(blueprintConfiguration),
      ...this.audioActionFactory.createAudioActions(blueprintConfiguration),
      ...this.transitionEffectActionFactory.createTransitionEffectActions(blueprintConfiguration),
      ...this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration, actionManifests),
      ...this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, actionManifests),
      ...this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration),
      ...this.splitScreenActionFactory.createSplitScreenActions(blueprintConfiguration, actionManifests),
      ...this.replayActionFactory.createReplayActions(blueprintConfiguration),
      ...this.robotActionFactory.createRobotActions()
    ]
  }

  private setFactories(blueprintConfiguration?: Tv2BlueprintConfiguration): void {
    this.cameraActionFactory = this.actionFactoryProvider.createCameraActionFactory(blueprintConfiguration)
    this.remoteActionFactory = this.actionFactoryProvider.createRemoteActionFactory(blueprintConfiguration)
    this.audioActionFactory = this.actionFactoryProvider.createAudioActionFactory(blueprintConfiguration)
    this.transitionEffectActionFactory = this.actionFactoryProvider.createTransitionEffectActionFactory(blueprintConfiguration)
    this.graphicsActionFactory = this.actionFactoryProvider.createGraphicsActionFactory(blueprintConfiguration)
    this.videoClipActionFactory = this.actionFactoryProvider.createVideoClipActionFactory(blueprintConfiguration)
    this.videoMixerActionFactory = this.actionFactoryProvider.createVideoMixerActionFactory(blueprintConfiguration)
    this.splitScreenActionFactory = this.actionFactoryProvider.createSplitScreenActionFactory(blueprintConfiguration)
    this.replayActionFactory = this.actionFactoryProvider.createReplayActionFactory(blueprintConfiguration)
    this.robotActionFactory = this.actionFactoryProvider.createRobotActionFactory(blueprintConfiguration)
  }
}
