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
import { DataChangeService } from '../services/interfaces/data-change-service'
import { IngestDataChangedService } from '../services/ingest-data-changed-service'
import { BlueprintTimelineBuilder } from '../services/blueprint-timeline-builder'
import { IngestService } from '../services/interfaces/ingest-service'
import { Tv2INewsIngestService } from '../services/tv2-inews-ingest-service'
import { HttpService } from '../services/interfaces/http-service'
import { GotHttpService } from '../services/got-http-service'
import { IngestedEntityToEntityMapper } from '../services/ingested-entity-to-entity-mapper'
import { ActionTriggerService } from '../services/interfaces/action-trigger-service'
import { ActionTriggerServiceImplementation } from '../services/action-trigger-service-implementation'
import { LoggerFacade } from '../../logger/logger-facade'
import { MediaDatabaseChangedService } from '../services/media-database-changed-service'
import { ConfigurationService } from '../services/interfaces/configuration-service'
import { ConfigurationServiceImplementation } from '../services/configuration-service-implementation'
import { DeviceChangedService } from '../services/device-changed-service'
import { ThrottledRundownService } from '../services/throttled-rundown-service'
import { ConfigurationChangedService } from '../services/configuration-changed-service'
import { StatusMessageService } from '../services/interfaces/status-message-service'
import { StatusMessageServiceImplementation } from '../services/status-message-service-implementation'

export class ServiceFacade {
  public static createRundownService(): RundownService {
    const rundownTimelineService: RundownTimelineService = new RundownTimelineService(
      EventEmitterFacade.createRundownEventEmitter(),
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createPieceRepository(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createTimelineBuilder(),
      ServiceFacade.createIngestService(),
      TimeoutCallbackScheduler.getInstance(LoggerFacade.createLogger()),
      BlueprintsFacade.createBlueprint()
    )

    return ThrottledRundownService.getInstance(rundownTimelineService)
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
      RepositoryFacade.createActionRepository(),
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

  public static createIngestChangeService(): DataChangeService {
    return IngestDataChangedService.getInstance(
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createPieceRepository(),
      RepositoryFacade.createTimelineRepository(),
      RepositoryFacade.createActionManifestRepository(),
      RepositoryFacade.createActionRepository(),
      RepositoryFacade.createConfigurationRepository(),
      BlueprintsFacade.createBlueprint(),
      ServiceFacade.createTimelineBuilder(),
      EventEmitterFacade.createRundownEventEmitter(),
      EventEmitterFacade.createActionEventEmitter(),
      new IngestedEntityToEntityMapper(),
      LoggerFacade.createLogger(),
      RepositoryFacade.createIngestedRundownChangeListener(),
      RepositoryFacade.createIngestedSegmentChangedListener(),
      RepositoryFacade.createIngestedPartChangedListener()
    )
  }

  public static createMediaDataChangeService(): DataChangeService {
    return MediaDatabaseChangedService.getInstance(
      EventEmitterFacade.createMediaEventEmitter(),
      RepositoryFacade.createMediaChangedListener()
    )
  }

  public static createIngestService(): IngestService {
    return new Tv2INewsIngestService(ServiceFacade.createHttpService(), RepositoryFacade.createRundownRepository())
  }

  private static createHttpService(): HttpService {
    return new GotHttpService()
  }

  public static createConfigurationService(): ConfigurationService {
    return new ConfigurationServiceImplementation(
      EventEmitterFacade.createConfigurationEventEmitter(),
      RepositoryFacade.createShelfConfigurationRepository()
    )
  }

  public static createDeviceDataChangedService(): DataChangeService {
    return DeviceChangedService.getInstance(
      ServiceFacade.createStatusMessageService(),
      RepositoryFacade.createDeviceRepository(),
      RepositoryFacade.createDeviceDataChangedListener(),
      LoggerFacade.createLogger()
    )
  }

  public static createConfigurationDataChangedService(): DataChangeService {
    return ConfigurationChangedService.getInstance(
      BlueprintsFacade.createBlueprint(),
      ServiceFacade.createStatusMessageService(),
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createShowStyleChangedListener(),
      LoggerFacade.createLogger()
    )
  }

  public static createStatusMessageService(): StatusMessageService {
    return new StatusMessageServiceImplementation(
      EventEmitterFacade.createStatusMessageEventEmitter(),
      RepositoryFacade.createStatusMessageRepository()
    )
  }
}
