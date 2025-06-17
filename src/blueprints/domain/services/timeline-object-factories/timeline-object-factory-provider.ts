import { Tv2VideoMixerTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import { Tv2AtemVideoMixerTimelineObjectFactory } from './tv2-atem-video-mixer-timeline-object-factory'
import { DeviceType } from '../../../../rundown-execution/domain/enums/device-type'
import { Tv2TriCasterVideoMixerTimelineObjectFactory } from './tv2-tri-caster-video-mixer-timeline-object-factory'
import { AtemToTriCasterSplitScreenConverter } from '../atem-to-tricaster-split-screen-converter'
import { Tv2MisconfigurationException } from '../../exceptions/tv2-misconfiguration-exception'
import { Tv2StudioBlueprintConfiguration } from '../../value-objects/tv2-studio-blueprint-configuration'
import { Tv2AudioMixerTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { Tv2SisyfosAudioMixerTimelineObjectFactory } from './tv2-sisyfos-audio-mixer-timeline-object-factory'
import { Tv2VideoClipTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-video-clip-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from './tv2-caspar-cg-timeline-object-factory'
import { Tv2AssetPathHelper } from '../tv2-asset-path-helper'
import { FrameTimeConverter } from '../frame-time-converter'
import { Tv2AudioBedTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-audio-bed-timeline-object-factory'
import { Tv2GraphicsTimelineObjectFactoryFactory } from './tv2-graphics-timeline-object-factory-factory'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-graphics-split-screen-timeline-object-factory'
import { Tv2RobotTimelineObjectFactory } from '../../interfaces/timeline-object-factories/tv2-robot-timeline-object-factory'
import { Tv2TelemetricsTimelineObjectFactory } from './tv2-telemetrics-timeline-object-factory'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'

const FRAME_RATE: number = 25

export class TimelineObjectFactoryProvider {
  private readonly logger: Logger

  constructor(logger: Logger) {
    this.logger = logger.tag(this.constructor.name)
  }

  public createVideoMixerTimelineObjectFactory(configuration?: Tv2StudioBlueprintConfiguration): Tv2VideoMixerTimelineObjectFactory {
    if (!configuration) {
      return new Tv2AtemVideoMixerTimelineObjectFactory(this.logger)
    }

    switch (configuration.videoMixerType) {
      case DeviceType.ATEM: {
        return new Tv2AtemVideoMixerTimelineObjectFactory(this.logger)
      }
      case DeviceType.TRICASTER: {
        return new Tv2TriCasterVideoMixerTimelineObjectFactory(new AtemToTriCasterSplitScreenConverter(), this.logger)
      }
      default: {
        throw new Tv2MisconfigurationException(`Invalid VideoMixerType: ${configuration.videoMixerType}`)
      }
    }
  }

  public createAudioMixerTimelineObjectFactory(): Tv2AudioMixerTimelineObjectFactory {
    return new Tv2SisyfosAudioMixerTimelineObjectFactory()
  }

  public createVideoClipTimelineObjectFactory(): Tv2VideoClipTimelineObjectFactory {
    return new Tv2CasparCgTimelineObjectFactory(this.createAssetPathHelper(), this.createFrameTimeConverter())
  }

  private createAssetPathHelper(): Tv2AssetPathHelper {
    return new Tv2AssetPathHelper()
  }

  private createFrameTimeConverter(): FrameTimeConverter {
    return new FrameTimeConverter(FRAME_RATE)
  }

  public createAudioBedTimelineObjectFactory(): Tv2AudioBedTimelineObjectFactory {
    return new Tv2CasparCgTimelineObjectFactory(this.createAssetPathHelper(), this.createFrameTimeConverter())
  }

  public createGraphicsTimelineObjectFactoryFactory(): Tv2GraphicsTimelineObjectFactoryFactory {
    return new Tv2GraphicsTimelineObjectFactoryFactory(this.createAssetPathHelper(), this.createFrameTimeConverter())
  }

  public createGraphicsSplitScreenTimelineObjectFactory(): Tv2GraphicsSplitScreenTimelineObjectFactory {
    return new Tv2CasparCgTimelineObjectFactory(this.createAssetPathHelper(), this.createFrameTimeConverter())
  }

  public createRobotTimelineObjectFactory(): Tv2RobotTimelineObjectFactory {
    return new Tv2TelemetricsTimelineObjectFactory()
  }
}
