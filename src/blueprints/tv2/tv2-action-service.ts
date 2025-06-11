import { BlueprintGenerateActions } from '../../rundown-execution/domain/value-objects/blueprint'
import { Configuration } from '../../rundown-execution/domain/entities/configuration'
import { Action, MutateActionMethods } from '../../action-system/domain/entities/action'
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
import { Tv2Logger } from './tv2-logger'

enum ActionTypeName {
  CAMERA = 'camera',
  REMOTE = 'remote',
  AUDIO = 'audio',
  TRANSITION_EFFECT = 'transition effect',
  GRAPHICS = 'graphics',
  VIDEO_CLIP = 'video clip',
  VIDEO_MIXER = 'video mixer',
  SPLIT_SCREEN = 'split screen',
  REPLAY = 'replay',
  ROBOT = 'robot',
}

export class Tv2ActionService implements BlueprintGenerateActions {

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
  private readonly logger: Tv2Logger

  constructor(
    private readonly configurationMapper: Tv2ConfigurationMapper,
    private readonly actionFactoryProvider: Tv2ActionFactoryProvider,
    logger: Tv2Logger,
  ) {
    this.logger = logger.tag(this.constructor.name)
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
    if (this.graphicsActionFactory.isGraphicsAction(action)) {
      return this.graphicsActionFactory.getMutateActionMethods(action)
    }
    if (this.videoMixerActionFactory.isVideoMixerAction(action)) {
      return this.videoMixerActionFactory.getMutateActionMethods(action)
    }
    return []
  }

  public generateActions(configuration: Configuration, showStyleVariantId: string, actionManifests: Tv2ActionManifest[]): Action[] {
    const blueprintConfiguration: Tv2BlueprintConfiguration = this.configurationMapper.mapBlueprintConfiguration(configuration, showStyleVariantId)
    this.setFactories(blueprintConfiguration)

    const actionGenerators: [ActionTypeName, () => Action[]][] = [
      [ActionTypeName.CAMERA, (): Action[] => this.cameraActionFactory.createCameraActions(blueprintConfiguration)],
      [ActionTypeName.REMOTE, (): Action[] => this.remoteActionFactory.createRemoteActions(blueprintConfiguration)],
      [ActionTypeName.AUDIO, (): Action[] => this.audioActionFactory.createAudioActions(blueprintConfiguration, actionManifests)],
      [ActionTypeName.TRANSITION_EFFECT, (): Action[] => this.transitionEffectActionFactory.createTransitionEffectActions(blueprintConfiguration)],
      [ActionTypeName.GRAPHICS, (): Action[] => this.graphicsActionFactory.createGraphicsActions(blueprintConfiguration, actionManifests)],
      [ActionTypeName.VIDEO_CLIP, (): Action[] => this.videoClipActionFactory.createVideoClipActions(blueprintConfiguration, actionManifests)],
      [ActionTypeName.VIDEO_MIXER, (): Action[] => this.videoMixerActionFactory.createVideoMixerActions(blueprintConfiguration)],
      [ActionTypeName.SPLIT_SCREEN, (): Action[] => this.splitScreenActionFactory.createSplitScreenActions(blueprintConfiguration, actionManifests)],
      [ActionTypeName.REPLAY, (): Action[] => this.replayActionFactory.createReplayActions(blueprintConfiguration)],
      [ActionTypeName.ROBOT, (): Action[] => this.robotActionFactory.createRobotActions()],
    ]

    return actionGenerators.flatMap(([actionKind, actionGenerator]: [string, () => Action[]]): Action[] => {
      try {
        return actionGenerator()
      } catch (error) {
        this.logger.data(error).error(`Failed creating ${actionKind} actions.`)
        return []
      }
    })
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
