import { RundownService } from '../services/interfaces/rundown-service'
import { RundownTimelineService } from '../services/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { TimelineBuilder } from '../services/interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../services/superfly-timeline-builder'
import { TimeoutCallbackScheduler } from '../services/timeout-callback-scheduler'
import { JsonObjectCloner } from '../services/json-object-cloner'
import { BlueprintsFacade } from '../../blueprints/blueprints-facade'
import { ActionService } from '../services/interfaces/action-service'
import { ExecuteActionService } from '../services/execute-action-service'
import { EventEmitterFacade } from '../../presentation/facades/event-emitter-facade'

export class ServiceFacade {
  public static createRundownService(): RundownService {
    return new RundownTimelineService(
      EventEmitterFacade.createRundownEventEmitter(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createTimelineRepository(),
      RepositoryFacade.createConfigurationRepository(),
      ServiceFacade.createTimelineBuilder(),
      TimeoutCallbackScheduler.getInstance(),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createTimelineBuilder(): TimelineBuilder {
    return new SuperflyTimelineBuilder(new JsonObjectCloner())
  }

  public static createActionService(): ActionService {
    return new ExecuteActionService(
      RepositoryFacade.createManifestRepository(),
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createActionRepository(),
      ServiceFacade.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      BlueprintsFacade.createBlueprint()
    )
  }
}
