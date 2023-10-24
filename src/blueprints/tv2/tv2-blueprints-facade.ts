import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionsService } from './tv2-actions-service'
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

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    const audioTimelineObjectFactory: Tv2AudioTimelineObjectFactory = new Tv2SisyfosAudioTimelineObjectFactory()
    const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = new Tv2AtemVideoMixerTimelineObjectFactory()
    const casparCgPathFixer: Tv2CasparCgPathFixer = new Tv2CasparCgPathFixer()

    return new Tv2Blueprint(
      new Tv2EndStateForPartService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2OnTimelineGenerateService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2ActionsService(
        new Tv2CameraActionFactory(),
        new Tv2TransitionActionFactory(),
        new Tv2AudioActionFactory(audioTimelineObjectFactory),
        new Tv2GraphicsActionFactory(
          new Tv2VizGraphicsTimelineObjectFactory(),
          new Tv2CasparCgGraphicsTimelineObjectFactory(casparCgPathFixer),
          audioTimelineObjectFactory,
          videoMixerTimelineObjectFactory,
          casparCgPathFixer
        ),
        new Tv2VideoMixerConfigurationActionFactory(videoMixerTimelineObjectFactory)
      )
    )
  }
}
