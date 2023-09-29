import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionsService } from './tv2-actions-service'
import { Tv2CameraActionFactory } from './factories/tv2-camera-action-factory'
import { Tv2TransitionActionFactory } from './factories/tv2-transition-action-factory'
import { Tv2AudioActionFactory } from './factories/tv2-audio-action-factory'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    return new Tv2Blueprint(
      new Tv2EndStateForPartService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2OnTimelineGenerateService(new Tv2SisyfosPersistentLayerFinder()),
      new Tv2ActionsService(
        new Tv2CameraActionFactory(),
        new Tv2TransitionActionFactory(),
        new Tv2AudioActionFactory()
      )
    )
  }
}
