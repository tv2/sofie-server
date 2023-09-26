import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionsService } from './tv2-actions-service'
import { Tv2CameraFactory } from './factories/tv2-camera-factory'
import { Tv2TransitionFactory } from './factories/tv2-transition-factory'
import { Tv2AudioFactory } from './factories/tv2-audio-factory'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    return new Tv2Blueprint(
      new Tv2EndStateForPartService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2OnTimelineGenerateService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2ActionsService(
        new Tv2CameraFactory(),
        new Tv2TransitionFactory(),
        new Tv2AudioFactory()
      )
    )
  }
}
