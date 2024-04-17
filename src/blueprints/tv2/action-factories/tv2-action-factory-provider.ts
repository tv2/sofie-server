import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
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
import {
  Tv2AtemVideoMixerTimelineObjectFactory
} from '../timeline-object-factories/tv2-atem-video-mixer-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { DeviceType } from '../../../model/enums/device-type'
import { Tv2LoggerFacade } from '../tv2-logger-facade'
import {
  Tv2TriCasterVideoMixerTimelineObjectFactory
} from '../timeline-object-factories/tv2-tri-caster-video-mixer-timeline-object-factory'
import { AtemToTriCasterSplitScreenConverter } from '../helpers/atem-to-tricaster-split-screen-converter'
import { Tv2MisconfigurationException } from '../exceptions/tv2-misconfiguration-exception'
import {
  Tv2SisyfosAudioTimelineObjectFactory
} from '../timeline-object-factories/tv2-sisyfos-audio-timeline-object-factory'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { Tv2ActionManifestMapper } from '../helpers/tv2-action-manifest-mapper'
import {
  Tv2GraphicsTimelineObjectFactoryFactory
} from '../timeline-object-factories/tv2-graphics-timeline-object-factory-factory'
import { Tv2StringHashConverter } from '../helpers/tv2-string-hash-converter'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-graphics-split-screen-timeline-object-factory'
import {
  Tv2RobotTimelineObjectFactory
} from '../timeline-object-factories/interfaces/tv2-robot-timeline-object-factory'
import {
  Tv2TelemetricsTimelineObjectFactory
} from '../timeline-object-factories/tv2-telemetrics-timeline-object-factory'


interface ActionFactoryInstance<T> {
  factory: T,
  shouldFactoryBeRecreated: (configuration: Tv2BlueprintConfiguration) => boolean
}

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

  public createCameraActionFactory(configuration: Tv2BlueprintConfiguration): Tv2CameraActionFactory {
    this.cameraActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.cameraActionFactoryInstance,
      () => {
        return new Tv2CameraActionFactory(
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createAudioTimelineObjectFactory()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.cameraActionFactoryInstance.factory
  }

  private getUpdatedActionFactoryInstance<T>(
    actionFactoryInstance: ActionFactoryInstance<T> | undefined,
    createFactoryCallback: () => T,
    shouldFactoryBeRecreatedCallback: (configuration: Tv2BlueprintConfiguration) => boolean,
    configuration: Tv2BlueprintConfiguration
  ): ActionFactoryInstance<T> {
    if (!!actionFactoryInstance && !actionFactoryInstance.shouldFactoryBeRecreated(configuration)) {
      return actionFactoryInstance
    }

    actionFactoryInstance = {
      factory: createFactoryCallback(),
      shouldFactoryBeRecreated: shouldFactoryBeRecreatedCallback
    }

    return actionFactoryInstance
  }

  private didVideoMixerTypeChange(oldConfiguration: Tv2BlueprintConfiguration, newConfiguration: Tv2BlueprintConfiguration): boolean {
    return oldConfiguration.studio.videoMixerType !== newConfiguration.studio.videoMixerType
  }

  private createVideoMixerTimelineObjectFactory(configuration: Tv2BlueprintConfiguration): Tv2VideoMixerTimelineObjectFactory {
    switch (configuration.studio.videoMixerType) {
      case DeviceType.ATEM: {
        return new Tv2AtemVideoMixerTimelineObjectFactory(Tv2LoggerFacade.createLogger())
      }
      case DeviceType.TRICASTER: {
        return new Tv2TriCasterVideoMixerTimelineObjectFactory(new AtemToTriCasterSplitScreenConverter(), Tv2LoggerFacade.createLogger())
      }
      default: {
        throw new Tv2MisconfigurationException(`Invalid VideoMixerType: ${configuration.studio.videoMixerType}`)
      }
    }
  }

  private createAudioTimelineObjectFactory(): Tv2AudioTimelineObjectFactory {
    return new Tv2SisyfosAudioTimelineObjectFactory()
  }

  public createRemoteActionFactory(configuration: Tv2BlueprintConfiguration): Tv2RemoteActionFactory {
    this.remoteActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.remoteActionFactoryInstance,
      () => {
        return new Tv2RemoteActionFactory(
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createAudioTimelineObjectFactory()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.remoteActionFactoryInstance.factory
  }

  public createTransitionEffectActionFactory(configuration: Tv2BlueprintConfiguration): Tv2TransitionEffectActionFactory {
    this.transitionEffectActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.transitionEffectActionFactoryInstance,
      () => {
        return new Tv2TransitionEffectActionFactory(
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createVideoClipTimelineObjectFactory(),
          this.createAudioTimelineObjectFactory(),
          this.createAssetPathHelper(),
          Tv2LoggerFacade.createLogger()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.transitionEffectActionFactoryInstance.factory
  }

  private createVideoClipTimelineObjectFactory(): Tv2VideoClipTimelineObjectFactory {
    return new Tv2CasparCgTimelineObjectFactory(this.createAssetPathHelper())
  }

  private createAssetPathHelper(): Tv2AssetPathHelper {
    return new Tv2AssetPathHelper()
  }

  public createAudioActionFactory(configuration: Tv2BlueprintConfiguration): Tv2AudioActionFactory {
    this.audioActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.audioActionFactoryInstance,
      () => {
        return new Tv2AudioActionFactory(
          this.createAudioTimelineObjectFactory(),
          this.createVideoClipTimelineObjectFactory()
        )
      },
      (): boolean => {
        return false // Currently we have no configuration changes that would warrant a new AudioActionFactory
      },
      configuration
    )

    return this.audioActionFactoryInstance.factory
  }

  public createGraphicsActionFactory(configuration: Tv2BlueprintConfiguration): Tv2GraphicsActionFactory {
    this.graphicsActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.graphicsActionFactoryInstance,
      () => {
        return new Tv2GraphicsActionFactory(
          this.createActionManifestMapper(),
          this.createGraphicsTimelineObjectFactoryFactory(),
          this.createAudioTimelineObjectFactory(),
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createStringHashConverter()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.graphicsActionFactoryInstance.factory
  }

  private createActionManifestMapper(): Tv2ActionManifestMapper {
    return new Tv2ActionManifestMapper()
  }

  private createGraphicsTimelineObjectFactoryFactory(): Tv2GraphicsTimelineObjectFactoryFactory {
    return new Tv2GraphicsTimelineObjectFactoryFactory(this.createAssetPathHelper())
  }

  private createStringHashConverter(): Tv2StringHashConverter {
    return new Tv2StringHashConverter()
  }

  public createVideoClipActionFactory(configuration: Tv2BlueprintConfiguration): Tv2VideoClipActionFactory {
    this.videoClipActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.videoClipActionFactoryInstance,
      () => {
        return new Tv2VideoClipActionFactory(
          this.createActionManifestMapper(),
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createAudioTimelineObjectFactory(),
          this.createVideoClipTimelineObjectFactory()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.videoClipActionFactoryInstance.factory
  }

  public createVideoMixerActionFactory(configuration: Tv2BlueprintConfiguration): Tv2VideoMixerConfigurationActionFactory {
    this.videoMixerConfigurationActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.videoMixerConfigurationActionFactoryInstance,
      () => {
        return new Tv2VideoMixerConfigurationActionFactory(
          this.createVideoMixerTimelineObjectFactory(configuration)
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.videoMixerConfigurationActionFactoryInstance.factory
  }

  public createSplitScreenActionFactory(configuration: Tv2BlueprintConfiguration): Tv2SplitScreenActionFactory {
    this.splitScreenActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.splitScreenActionFactoryInstance,
      () => {
        return new Tv2SplitScreenActionFactory(
          this.createActionManifestMapper(),
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createAudioTimelineObjectFactory(),
          this.createGraphicsSplitScreenTimelineObjectFactory(),
          this.createVideoClipTimelineObjectFactory(),
          this.createAssetPathHelper()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.splitScreenActionFactoryInstance.factory
  }

  private createGraphicsSplitScreenTimelineObjectFactory(): Tv2GraphicsSplitScreenTimelineObjectFactory {
    return new Tv2CasparCgTimelineObjectFactory(this.createAssetPathHelper())
  }

  public createReplayActionFactory(configuration: Tv2BlueprintConfiguration): Tv2ReplayActionFactory {
    this.replayActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.replayActionFactoryInstance,
      () => {
        return new Tv2ReplayActionFactory(
          this.createVideoMixerTimelineObjectFactory(configuration),
          this.createAudioTimelineObjectFactory()
        )
      },
      (c: Tv2BlueprintConfiguration): boolean => {
        return this.didVideoMixerTypeChange(c, configuration)
      },
      configuration
    )

    return this.replayActionFactoryInstance.factory
  }

  public createRobotActionFactory(configuration: Tv2BlueprintConfiguration): Tv2RobotActionFactory {
    this.robotActionFactoryInstance = this.getUpdatedActionFactoryInstance(
      this.robotActionFactoryInstance,
      () => {
        return new Tv2RobotActionFactory(
          this.createRobotTimelineObjectFactory()
        )
      },
      (): boolean => {
        return false // Currently we have no configuration changes that warrant a new RobotActionFactory.
      },
      configuration
    )

    return this.robotActionFactoryInstance.factory
  }

  private createRobotTimelineObjectFactory(): Tv2RobotTimelineObjectFactory {
    return new Tv2TelemetricsTimelineObjectFactory()
  }
}

