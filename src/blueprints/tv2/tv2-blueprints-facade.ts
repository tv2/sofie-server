import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionService } from './tv2-action-service'
import {
  Tv2VizGraphicsTimelineObjectFactory
} from './timeline-object-factories/tv2-viz-graphics-timeline-object-factory'
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
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import { Tv2AudioTimelineObjectFactory } from './timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2GraphicsTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-graphics-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2BlueprintConfigurationMapper } from './helpers/tv2-blueprint-configuration-mapper'
import { Tv2CasparCgTimelineObjectFactory } from './timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { AssetFolderHelper } from './helpers/asset-folder-helper'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    const tv2SisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = new Tv2SisyfosPersistentLayerFinder()
    const tv2AudioTimelineObjectFactory: Tv2AudioTimelineObjectFactory = new Tv2SisyfosAudioTimelineObjectFactory()
    const tv2GraphicsTimelineObjectFactory: Tv2GraphicsTimelineObjectFactory = new Tv2VizGraphicsTimelineObjectFactory()
    const tv2VideoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = new Tv2AtemVideoMixerTimelineObjectFactory()
    const tv2CasparCgTimelineObjectFactory: Tv2CasparCgTimelineObjectFactory = new Tv2CasparCgTimelineObjectFactory()

    const assetFolderHelper: AssetFolderHelper = new AssetFolderHelper()

    const actionService: Tv2ActionService = new Tv2ActionService(
      new Tv2BlueprintConfigurationMapper(),
      new Tv2CameraActionFactory(tv2VideoMixerTimelineObjectFactory, tv2AudioTimelineObjectFactory),
      new Tv2RemoteActionFactory(tv2VideoMixerTimelineObjectFactory, tv2AudioTimelineObjectFactory),
      new Tv2TransitionEffectActionFactory(
        tv2VideoMixerTimelineObjectFactory,
        tv2CasparCgTimelineObjectFactory,
        tv2AudioTimelineObjectFactory,
        assetFolderHelper
      ),
      new Tv2AudioActionFactory(tv2AudioTimelineObjectFactory, tv2CasparCgTimelineObjectFactory),
      new Tv2GraphicsActionFactory(tv2GraphicsTimelineObjectFactory),
      new Tv2VideoClipActionFactory(
        tv2VideoMixerTimelineObjectFactory,
        tv2AudioTimelineObjectFactory,
        tv2CasparCgTimelineObjectFactory
      ),
      new Tv2VideoMixerConfigurationActionFactory(tv2VideoMixerTimelineObjectFactory),
      new Tv2SplitScreenActionFactory(
        tv2VideoMixerTimelineObjectFactory,
        tv2AudioTimelineObjectFactory,
        tv2CasparCgTimelineObjectFactory,
        assetFolderHelper
      ),
      new Tv2ReplayActionFactory(tv2VideoMixerTimelineObjectFactory, tv2AudioTimelineObjectFactory)
    )

    return new Tv2Blueprint(
      new Tv2EndStateForPartService(tv2SisyfosPersistentLayerFinder),
      new Tv2OnTimelineGenerateService(tv2SisyfosPersistentLayerFinder),
      actionService
    )
  }
}
