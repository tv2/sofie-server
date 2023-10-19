import { RundownService } from '../services/interfaces/rundown-service'
import { RundownEventService } from '../services/rundown-event-service'
import { RundownTimelineService } from '../services/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { TimelineBuilder } from '../services/interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../services/superfly-timeline-builder'
import { RundownEventBuilderImplementation } from '../services/rundown-event-builder-implementation'
import { RundownEventBuilder } from '../services/interfaces/rundown-event-builder'
import { TimeoutCallbackScheduler } from '../services/timeout-callback-scheduler'
import { JsonObjectCloner } from '../services/json-object-cloner'
import { BlueprintsFacade } from '../../blueprints/blueprints-facade'
import { ActionService } from '../services/interfaces/action-service'
import { ExecuteActionService } from '../services/execute-action-service'

export class ServiceFacade {
  public static createRundownService(): RundownService {
    return new RundownTimelineService(
      RundownEventService.getInstance(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createTimelineRepository(),
      RepositoryFacade.createConfigurationRepository(),
      ServiceFacade.createTimelineBuilder(),
      ServiceFacade.createRundownEventBuilder(),
      TimeoutCallbackScheduler.getInstance(),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createTimelineBuilder(): TimelineBuilder {
    return new SuperflyTimelineBuilder(new JsonObjectCloner())
  }

  public static createRundownEventBuilder(): RundownEventBuilder {
    return new RundownEventBuilderImplementation()
  }

  public static createActionService(): ActionService {
    return new ExecuteActionService(
      RepositoryFacade.createManifestRepository(),
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createActionRepository(),
      this.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      BlueprintsFacade.createBlueprint()
    )
  }
}
