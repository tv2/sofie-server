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
import { IngestChangeService } from '../services/interfaces/ingest-change-service'
import { DatabaseChangeIngestService } from '../services/database-change-ingest-service'
import { BlueprintTimelineBuilder } from '../services/blueprint-timeline-builder'
import { IngestService } from '../services/interfaces/ingest-service'
import { Tv2INewsIngestService } from '../services/tv2-inews-ingest-service'
import { HttpService } from '../services/interfaces/http-service'
import { GotHttpService } from '../services/got-http-service'
import { IngestedEntityToEntityMapper } from '../services/ingested-entity-to-entity-mapper'
import { ConsoleLogger } from '../../console-logger'
import { ActionTriggerService } from '../services/interfaces/action-trigger-service'
import { ActionTriggerServiceImplementation } from '../services/action-trigger-service-implementation'

export class ServiceFacade {
  public static createRundownService(): RundownService {
    return new RundownTimelineService(
      EventEmitterFacade.createRundownEventEmitter(),
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createPieceRepository(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createTimelineBuilder(),
      TimeoutCallbackScheduler.getInstance(ConsoleLogger.getInstance()),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createTimelineBuilder(): TimelineBuilder {
    const superflyTimelineBuilder: TimelineBuilder = new SuperflyTimelineBuilder(new JsonObjectCloner())
    return new BlueprintTimelineBuilder(
      superflyTimelineBuilder,
      RepositoryFacade.createConfigurationRepository(),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createActionService(): ActionService {
    return new ExecuteActionService(
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createActionRepository(),
      RepositoryFacade.createActionManifestRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createMediaRepository(),
      ServiceFacade.createRundownService(),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createActionTriggerService(): ActionTriggerService {
    return new ActionTriggerServiceImplementation(
      EventEmitterFacade.createActionTriggerEventEmitter(),
      RepositoryFacade.createActionTriggerRepository()
    )
  }

  public static createIngestChangeService(): IngestChangeService {
    return DatabaseChangeIngestService.getInstance(
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createTimelineBuilder(),
      EventEmitterFacade.createRundownEventEmitter(),
      new IngestedEntityToEntityMapper(),
      ConsoleLogger.getInstance(),
      RepositoryFacade.createIngestedRundownChangeListener(),
      RepositoryFacade.createIngestedSegmentChangedListener(),
      RepositoryFacade.createIngestedPartChangedListener()
    )
  }

  public static createIngestService(): IngestService {
    const httpService: HttpService = new GotHttpService()
    return new Tv2INewsIngestService(httpService, RepositoryFacade.createRundownRepository())
  }
}
