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
import { Tv2TransitionActionFactory } from './action-factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2AudioTimelineObjectFactory } from './timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from './timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2CasparCgPathFixer } from './helpers/tv2-caspar-cg-path-fixer'
import {
  Tv2CasparCgGraphicsTimelineObjectFactory
} from './timeline-object-factories/tv2-caspar-cg-graphics-timeline-object-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    const tv2CasparCgPathFixer: Tv2CasparCgPathFixer = new Tv2CasparCgPathFixer()
    const tv2SisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = new Tv2SisyfosPersistentLayerFinder()
    const tv2AudioTimelineObjectFactory: Tv2AudioTimelineObjectFactory = new Tv2SisyfosAudioTimelineObjectFactory()
    const tv2VizGraphicsTimelineObjectFactory: Tv2VizGraphicsTimelineObjectFactory = new Tv2VizGraphicsTimelineObjectFactory()
    const tv2CasparCgGraphicsTimelineObjectFactory: Tv2CasparCgGraphicsTimelineObjectFactory = new Tv2CasparCgGraphicsTimelineObjectFactory(tv2CasparCgPathFixer)
    const tv2VideoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = new Tv2AtemVideoMixerTimelineObjectFactory()

    return new Tv2Blueprint(
      new Tv2EndStateForPartService(tv2SisyfosPersistentLayerFinder),
      new Tv2OnTimelineGenerateService(tv2SisyfosPersistentLayerFinder),
      new Tv2ActionService(
        new Tv2CameraActionFactory(tv2AudioTimelineObjectFactory),
        new Tv2TransitionActionFactory(),
        new Tv2AudioActionFactory(tv2AudioTimelineObjectFactory),
        new Tv2GraphicsActionFactory(
          tv2VizGraphicsTimelineObjectFactory,
          tv2CasparCgGraphicsTimelineObjectFactory,
          tv2AudioTimelineObjectFactory,
          tv2VideoMixerTimelineObjectFactory,
          tv2CasparCgPathFixer
        ),
        new Tv2VideoClipActionFactory(
          tv2VideoMixerTimelineObjectFactory,
          tv2AudioTimelineObjectFactory
        ),
        new Tv2VideoMixerConfigurationActionFactory(tv2VideoMixerTimelineObjectFactory)
      )
    )
  }
}
