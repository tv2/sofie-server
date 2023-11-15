import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionService } from './tv2-action-service'
import {
  Tv2SisyfosAudioTimelineObjectFactory
} from './timeline-object-factories/tv2-sisyfos-audio-timeline-object-factory'
import {
  Tv2AtemVideoMixerTimelineObjectFactory
} from './timeline-object-factories/tv2-atem-video-mixer-timeline-object-factory'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2TransitionEffectActionFactory } from './action-factories/tv2-transition-effect-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2AudioTimelineObjectFactory } from './timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2AssetPathHelper } from './helpers/tv2-asset-path-helper'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2ShowStyleBlueprintConfigurationMapper } from './helpers/tv2-show-style-blueprint-configuration-mapper'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2StringHashConverter } from './helpers/tv2-string-hash-converter'
import { Tv2CasparCgTimelineObjectFactory } from './timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'
import { Tv2StudioBlueprintConfigurationMapper } from './helpers/tv2-studio-blueprint-configuration-mapper'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import {
  Tv2VideoClipTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-graphics-split-screen-timeline-object-factory'
import {
  Tv2GraphicsTimelineObjectFactoryFactory
} from './timeline-object-factories/tv2-graphics-timeline-object-factory-factory'
import { Tv2ActionManifestMapper } from './helpers/tv2-action-manifest-mapper'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    const configurationMapper: Tv2ConfigurationMapper = new Tv2ConfigurationMapper(
      new Tv2StudioBlueprintConfigurationMapper(),
      new Tv2ShowStyleBlueprintConfigurationMapper()
    )
    const actionManifestMapper: Tv2ActionManifestMapper = new Tv2ActionManifestMapper()
    const assetPathHelper: Tv2AssetPathHelper = new Tv2AssetPathHelper()
    const stringHasConverter: Tv2StringHashConverter = new Tv2StringHashConverter()
    const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = new Tv2SisyfosPersistentLayerFinder()

    const audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory = new Tv2SisyfosAudioTimelineObjectFactory()
    const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = new Tv2AtemVideoMixerTimelineObjectFactory()

    const graphicsTimelineObjectFactoryFactory: Tv2GraphicsTimelineObjectFactoryFactory = new Tv2GraphicsTimelineObjectFactoryFactory(assetPathHelper)
    const graphicsSplitScreenTimelineObjectFactory: Tv2GraphicsSplitScreenTimelineObjectFactory = new Tv2CasparCgTimelineObjectFactory(assetPathHelper)
    const videoClipTimelineObjectFactory: Tv2VideoClipTimelineObjectFactory = new Tv2CasparCgTimelineObjectFactory(assetPathHelper)

    const actionService: Tv2ActionService = new Tv2ActionService(
      configurationMapper,
      new Tv2CameraActionFactory(videoMixerTimelineObjectFactory, audioTimelineObjectFactory),
      new Tv2RemoteActionFactory(videoMixerTimelineObjectFactory, audioTimelineObjectFactory),
      new Tv2TransitionEffectActionFactory(
        videoMixerTimelineObjectFactory,
        videoClipTimelineObjectFactory,
        audioTimelineObjectFactory,
        assetPathHelper
      ),
      new Tv2AudioActionFactory(audioTimelineObjectFactory),
      new Tv2GraphicsActionFactory(
        actionManifestMapper,
        graphicsTimelineObjectFactoryFactory,
        audioTimelineObjectFactory,
        videoMixerTimelineObjectFactory,
        stringHasConverter
      ),
      new Tv2VideoClipActionFactory(
        actionManifestMapper,
        videoMixerTimelineObjectFactory,
        audioTimelineObjectFactory,
        videoClipTimelineObjectFactory
      ),
      new Tv2VideoMixerConfigurationActionFactory(videoMixerTimelineObjectFactory),
      new Tv2SplitScreenActionFactory(
        actionManifestMapper,
        videoMixerTimelineObjectFactory,
        audioTimelineObjectFactory,
        graphicsSplitScreenTimelineObjectFactory,
        videoClipTimelineObjectFactory,
        assetPathHelper
      ),
      new Tv2ReplayActionFactory(videoMixerTimelineObjectFactory, audioTimelineObjectFactory)
    )

    return new Tv2Blueprint(
      new Tv2EndStateForPartService(sisyfosPersistentLayerFinder),
      new Tv2OnTimelineGenerateService(configurationMapper, sisyfosPersistentLayerFinder),
      actionService
    )
  }
}
