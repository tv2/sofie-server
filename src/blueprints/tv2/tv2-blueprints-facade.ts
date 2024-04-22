import { Blueprint } from '../../model/value-objects/blueprint'
import { Tv2Blueprint } from './tv2-blueprint'
import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { Tv2SisyfosPersistentLayerFinder } from './helpers/tv2-sisyfos-persistent-layer-finder'
import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { Tv2ActionService } from './tv2-action-service'
import { Tv2ShowStyleBlueprintConfigurationMapper } from './helpers/tv2-show-style-blueprint-configuration-mapper'
import { Tv2StudioBlueprintConfigurationMapper } from './helpers/tv2-studio-blueprint-configuration-mapper'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import { Tv2BlueprintConfigurationValidator } from './tv2-blueprint-configuration-validator'
import { Tv2ActionFactoryProvider } from './action-factories/tv2-action-factory-provider'

export class Tv2BlueprintsFacade {
  public static createBlueprint(): Blueprint {
    const configurationMapper: Tv2ConfigurationMapper = new Tv2ConfigurationMapper(
      new Tv2StudioBlueprintConfigurationMapper(),
      new Tv2ShowStyleBlueprintConfigurationMapper()
    )
    const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = new Tv2SisyfosPersistentLayerFinder()

    const actionService: Tv2ActionService = new Tv2ActionService(
      configurationMapper,
      new Tv2ActionFactoryProvider()
    )

    return new Tv2Blueprint(
      new Tv2EndStateForPartService(sisyfosPersistentLayerFinder),
      new Tv2OnTimelineGenerateService(configurationMapper, sisyfosPersistentLayerFinder),
      actionService,
      new Tv2BlueprintConfigurationValidator(configurationMapper)
    )
  }
}
