import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2CameraActionFactory } from './tv2-camera-action-factory'
import { Tv2RemoteActionFactory } from './tv2-remote-action-factory'
import { Tv2TransitionEffectActionFactory } from './tv2-transition-effect-action-factory'
import { Tv2AudioActionFactory } from './tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './tv2-graphics-action-factory'
import { Tv2VideoClipActionFactory } from './tv2-video-clip-action-factory'
import { Tv2VideoMixerConfigurationActionFactory } from './tv2-video-mixer-configuration-action-factory'
import { Tv2SplitScreenActionFactory } from './tv2-split-screen-action-factory'
import { Tv2ReplayActionFactory } from './tv2-replay-action-factory'
import { Tv2RobotActionFactory } from './tv2-robot-action-factory'
import { Tv2AssetPathHelper } from '../tv2-asset-path-helper'
import { Tv2ActionManifestMapper } from '../tv2-action-manifest-mapper'
import { StringHashGenerator } from '../../interfaces/string-hash-generator'
import { FrameTimeConverter } from '../frame-time-converter'
import { Tv2ConfigurationMapper } from '../tv2-configuration-mapper'
import { TimelineObjectFactoryProvider } from '../timeline-object-factories/timeline-object-factory-provider'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'
import { DeepObjectCloner } from '../../../../cross-cutting-concerns/domain/services/deep-object-cloner'

interface ActionFactoryInstance<T> {
  factory: T
  shouldFactoryBeRecreated: (configuration?: Tv2BlueprintConfiguration) => boolean
}
const FRAME_RATE: number = 25

export class Tv2ActionFactoryProvider {
  private cameraActionFactoryInstance: ActionFactoryInstance<Tv2CameraActionFactory>
  private remoteActionFactoryInstance: ActionFactoryInstance<Tv2RemoteActionFactory>
  private transitionEffectActionFactoryInstance: ActionFactoryInstance<Tv2TransitionEffectActionFactory>
  private audioActionFactoryInstance: ActionFactoryInstance<Tv2AudioActionFactory>
  private graphicsActionFactoryInstance: ActionFactoryInstance<Tv2GraphicsActionFactory>
  private videoClipActionFactoryInstance: ActionFactoryInstance<Tv2VideoClipActionFactory>
  private videoMixerConfigurationActionFactoryInstance: ActionFactoryInstance<Tv2VideoMixerConfigurationActionFactory>
  private splitScreenActionFactoryInstance: ActionFactoryInstance<Tv2SplitScreenActionFactory>
  private replayActionFactoryInstance: ActionFactoryInstance<Tv2ReplayActionFactory>
  private robotActionFactoryInstance: ActionFactoryInstance<Tv2RobotActionFactory>

  private readonly logger: Logger

  public constructor(
    private readonly configurationMapper: Tv2ConfigurationMapper,
    private readonly timelineObjectFactoryProvider: TimelineObjectFactoryProvider,
    private readonly stringHashGenerator: StringHashGenerator,
    private readonly objectCloner: DeepObjectCloner,
    logger: Logger
  ) {
    this.logger = logger.tag(this.constructor.name)
  }

  public createCameraActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2CameraActionFactory {
    this.cameraActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.cameraActionFactoryInstance,
      () => {
        return new Tv2CameraActionFactory(
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory()
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.cameraActionFactoryInstance.factory
  }

  private getUpdatedActionFactoryInstance<T>(
    actionFactoryInstance: ActionFactoryInstance<T> | undefined,
    createFactoryCallback: () => T,
    shouldFactoryBeRecreatedCallback: (configuration?: Tv2BlueprintConfiguration) => boolean,
    configuration?: Tv2BlueprintConfiguration
  ): ActionFactoryInstance<T> {
    if (actionFactoryInstance && !actionFactoryInstance.shouldFactoryBeRecreated(configuration)) {
      return actionFactoryInstance
    }

    return {
      factory: createFactoryCallback(),
      shouldFactoryBeRecreated: shouldFactoryBeRecreatedCallback
    }
  }

  private didVideoMixerTypeChange(oldConfiguration?: Tv2BlueprintConfiguration, newConfiguration?: Tv2BlueprintConfiguration): boolean {
    return oldConfiguration?.studio.videoMixerType !== newConfiguration?.studio.videoMixerType
  }

  public createRemoteActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2RemoteActionFactory {
    this.remoteActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.remoteActionFactoryInstance,
      () => {
        return new Tv2RemoteActionFactory(
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory()
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.remoteActionFactoryInstance.factory
  }

  public createTransitionEffectActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2TransitionEffectActionFactory {
    this.transitionEffectActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.transitionEffectActionFactoryInstance,
      () => {
        return new Tv2TransitionEffectActionFactory(
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createVideoClipTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory(),
          this.createAssetPathHelper(),
          this.createFrameTimeConverter(),
          this.logger
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.transitionEffectActionFactoryInstance.factory
  }

  private createAssetPathHelper(): Tv2AssetPathHelper {
    return new Tv2AssetPathHelper()
  }

  private createFrameTimeConverter(): FrameTimeConverter {
    return new FrameTimeConverter(FRAME_RATE)
  }

  public createAudioActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2AudioActionFactory {
    this.audioActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.audioActionFactoryInstance,
      () => {
        return new Tv2AudioActionFactory(
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createAudioBedTimelineObjectFactory(),
          this.createFrameTimeConverter(),
          this.logger
        )
      },
      (): boolean => {
        return false // Currently we have no configuration changes that would warrant a new AudioActionFactory
      },
      configuration
    )

    return this.audioActionFactoryInstance.factory
  }

  public createGraphicsActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2GraphicsActionFactory {
    this.graphicsActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.graphicsActionFactoryInstance,
      () => {
        return new Tv2GraphicsActionFactory(
          this.createActionManifestMapper(),
          this.timelineObjectFactoryProvider.createGraphicsTimelineObjectFactoryFactory(),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.stringHashGenerator,
          this.configurationMapper
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.graphicsActionFactoryInstance.factory
  }

  private createActionManifestMapper(): Tv2ActionManifestMapper {
    return new Tv2ActionManifestMapper(this.logger)
  }

  public createVideoClipActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2VideoClipActionFactory {
    this.videoClipActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.videoClipActionFactoryInstance,
      () => {
        return new Tv2VideoClipActionFactory(
          this.createActionManifestMapper(),
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createVideoClipTimelineObjectFactory()
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.videoClipActionFactoryInstance.factory
  }

  public createVideoMixerActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2VideoMixerConfigurationActionFactory {
    this.videoMixerConfigurationActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.videoMixerConfigurationActionFactoryInstance,
      () => {
        return new Tv2VideoMixerConfigurationActionFactory(
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio)
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.videoMixerConfigurationActionFactoryInstance.factory
  }

  public createSplitScreenActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2SplitScreenActionFactory {
    this.splitScreenActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.splitScreenActionFactoryInstance,
      () => {
        return new Tv2SplitScreenActionFactory(
          this.createActionManifestMapper(),
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createGraphicsSplitScreenTimelineObjectFactory(),
          this.timelineObjectFactoryProvider.createVideoClipTimelineObjectFactory(),
          this.stringHashGenerator,
          this.createAssetPathHelper(),
          this.objectCloner,
          this.logger,
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.splitScreenActionFactoryInstance.factory
  }

  public createReplayActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2ReplayActionFactory {
    this.replayActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.replayActionFactoryInstance,
      () => {
        return new Tv2ReplayActionFactory(
          this.timelineObjectFactoryProvider.createVideoMixerTimelineObjectFactory(configuration?.studio),
          this.timelineObjectFactoryProvider.createAudioMixerTimelineObjectFactory()
        )
      },
      (c?: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.replayActionFactoryInstance.factory
  }

  public createRobotActionFactory(configuration?: Tv2BlueprintConfiguration): Tv2RobotActionFactory {
    this.robotActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.robotActionFactoryInstance,
      () => {
        return new Tv2RobotActionFactory(
          this.timelineObjectFactoryProvider.createRobotTimelineObjectFactory()
        )
      },
      (): boolean => {
        return false // Currently we have no configuration changes that warrant a new RobotActionFactory.
      },
      configuration
    )

    return this.robotActionFactoryInstance.factory
  }
}
