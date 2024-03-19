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
import { DatabaseChangeService } from '../services/interfaces/database-change-service'
import { IngestDatabaseChangeService } from '../services/ingest-database-change-service'
import { BlueprintTimelineBuilder } from '../services/blueprint-timeline-builder'
import { IngestService } from '../services/interfaces/ingest-service'
import { Tv2INewsIngestService } from '../services/tv2-inews-ingest-service'
import { HttpService } from '../services/interfaces/http-service'
import { GotHttpService } from '../services/got-http-service'
import { IngestedEntityToEntityMapper } from '../services/ingested-entity-to-entity-mapper'
import { ActionTriggerService } from '../services/interfaces/action-trigger-service'
import { ActionTriggerServiceImplementation } from '../services/action-trigger-service-implementation'
import { LoggerFacade } from '../../logger/logger-facade'
import { MediaDatabaseChangeService } from '../services/media-database-change-service'
import { ConfigurationService } from '../services/interfaces/configuration-service'
import { ConfigurationServiceImplementation } from '../services/configuration-service-implementation'
import { DeviceChangedService } from '../services/device-changed-service'
import { RundownLockService } from '../services/rundown-lock-service'

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
      TimeoutCallbackScheduler.getInstance(LoggerFacade.createLogger()),
      BlueprintsFacade.createBlueprint()
    )

    return RundownLockService.getInstance(rundownTimelineService)
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

  public static createIngestChangeService(): DatabaseChangeService {
    return IngestDatabaseChangeService.getInstance(
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createPieceRepository(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createTimelineBuilder(),
      EventEmitterFacade.createRundownEventEmitter(),
      new IngestedEntityToEntityMapper(),
      LoggerFacade.createLogger(),
      RepositoryFacade.createIngestedRundownChangeListener(),
      RepositoryFacade.createIngestedSegmentChangedListener(),
      RepositoryFacade.createIngestedPartChangedListener()
    )
  }

  public static createMediaDataChangeService(): DatabaseChangeService {
    return MediaDatabaseChangeService.getInstance(
      EventEmitterFacade.createMediaEventEmitter(),
      RepositoryFacade.createMediaChangedListener()
    )
  }

  public static createIngestService(): IngestService {
    const httpService: HttpService = new GotHttpService()
    return new Tv2INewsIngestService(httpService, RepositoryFacade.createRundownRepository())
  }

  public static createConfigurationService(): ConfigurationService {
    return new ConfigurationServiceImplementation(
      EventEmitterFacade.createConfigurationEventEmitter(),
      RepositoryFacade.createShelfConfigurationRepository()
    )
  }

  public static createDeviceDataChangedService(): DatabaseChangeService {
    return DeviceChangedService.getInstance(
      EventEmitterFacade.createStatusMessageEventEmitter(),
      RepositoryFacade.createStatusMessageRepository(),
      RepositoryFacade.createDeviceRepository(),
      RepositoryFacade.createDeviceDataChangedListener(),
      LoggerFacade.createLogger()
    )
  }
}
