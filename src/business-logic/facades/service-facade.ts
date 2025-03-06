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
import { BlueprintTimelineBuilder } from '../services/blueprint-timeline-builder'
import { IngestService } from '../services/interfaces/ingest-service'
import { Tv2INewsIngestService } from '../services/tv2-inews-ingest-service'
import { HttpService } from '../services/interfaces/http-service'
import { GotHttpService } from '../services/got-http-service'
import { IngestedEntityToEntityMapper } from '../services/ingested-entity-to-entity-mapper'
import { TriggerService } from '../services/interfaces/trigger-service'
import { TriggerServiceImplementation } from '../services/trigger-service-implementation'
import { LoggerFacade } from '../../logger/logger-facade'
import { MediaDatabaseChangedService } from '../services/media-database-changed-service'
import { ConfigurationService } from '../services/interfaces/configuration-service'
import { ConfigurationServiceImplementation } from '../services/configuration-service-implementation'
import { DeviceChangedService } from '../services/device-changed-service'
import { ConfigurationChangedService } from '../services/configuration-changed-service'
import { StatusMessageService } from '../services/interfaces/status-message-service'
import { StatusMessageServiceImplementation } from '../services/status-message-service-implementation'
import { DeviceServiceImplementation } from '../services/device-service-implementation'
import { DeviceService } from '../services/interfaces/device-service'
import { PlayoutService } from '../services/interfaces/playoutService'
import { PlayoutGatewayService } from '../services/playout-gateway-service'
import { ThrottledRundownService } from '../services/throttled-rundown-service'
import { IngestRundownSynchronizer } from '../services/ingest-rundown-synchronizer'
import { EntityChangeDetector } from '../services/entity-change-detector'
import { IngestDataChangeService } from '../services/ingest-data-change-service'
import { ActionGenerationService } from '../services/action-generation-service'
import { SynchronizedRundownService } from '../services/synchronized-rundown-service'
import { AsyncLock } from '../async-lock'
import { MacroServiceImplementation } from '../services/macro-service-implementation'
import { MacroService } from '../services/interfaces/macro-service'

export class ServiceFacade {

  private static readonly rundownLock: AsyncLock = new AsyncLock(LoggerFacade.createLogger())

  public static createRundownService(): RundownService {
    const rundownTimelineService: RundownTimelineService = new RundownTimelineService(
      EventEmitterFacade.createRundownEventEmitter(),
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createTimelineBuilder(),
      ServiceFacade.createIngestService(),
      ServiceFacade.createPlayoutService(),
      TimeoutCallbackScheduler.getInstance(LoggerFacade.createLogger()),
      BlueprintsFacade.createBlueprint(),
      LoggerFacade.createLogger(),
    )
    return ThrottledRundownService.getInstance(new SynchronizedRundownService(rundownTimelineService, this.rundownLock))
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
      RepositoryFacade.createConfigurationRepository(),
      ServiceFacade.createRundownService(),
      BlueprintsFacade.createBlueprint()
    )
  }

  public static createMacroService(): MacroService {
    return new MacroServiceImplementation(EventEmitterFacade.createMacroEventEmitter(), RepositoryFacade.createMacroRepository())
  }

  public static createTriggerService(): TriggerService {
    return new TriggerServiceImplementation(
      EventEmitterFacade.createTriggerEventEmitter(),
      RepositoryFacade.createTriggerRepository()
    )
  }

  public static createIngestChangeService(): DataChangeService {
    return new IngestDataChangeService(
      RepositoryFacade.createIngestedRundownRepository(),
      RepositoryFacade.createRundownRepository(),
      this.rundownLock,
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPartRepository(),
      RepositoryFacade.createPieceRepository(),
      RepositoryFacade.createIngestedRundownChangeListener(),
      RepositoryFacade.createIngestedSegmentChangedListener(),
      RepositoryFacade.createIngestedPartChangedListener(),
      RepositoryFacade.createIngestedPieceChangedListener(),
      ServiceFacade.createIngestRundownSynchronizer(),
      new IngestedEntityToEntityMapper(),
      EventEmitterFacade.createRundownEventEmitter(),
      ServiceFacade.createTimelineBuilder(),
      RepositoryFacade.createTimelineRepository(),
      ServiceFacade.createActionGenerationService(),
      LoggerFacade.createLogger(),
    )
  }

  public static createActionGenerationService(): ActionGenerationService {
    return new ActionGenerationService(
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createActionManifestRepository(),
      RepositoryFacade.createActionRepository(),
      EventEmitterFacade.createActionEventEmitter(),
      BlueprintsFacade.createBlueprint(),
    )
  }

  public static createIngestRundownSynchronizer(): IngestRundownSynchronizer {
    return new IngestRundownSynchronizer(new IngestedEntityToEntityMapper(), ServiceFacade.createEntityChangeDetector())
  }

  public static createEntityChangeDetector(): EntityChangeDetector {
    return new EntityChangeDetector()
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

  public static createPlayoutService(): PlayoutService {
    return new PlayoutGatewayService(ServiceFacade.createHttpService(), LoggerFacade.createLogger())
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
      RepositoryFacade.createCoreDeviceRepository(),
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
      RepositoryFacade.createShowStyleVariantConfigurationListener(),
      LoggerFacade.createLogger()
    )
  }

  public static createStatusMessageService(): StatusMessageService {
    return new StatusMessageServiceImplementation(
      EventEmitterFacade.createStatusMessageEventEmitter(),
      RepositoryFacade.createStatusMessageRepository()
    )
  }

  public static createDeviceService(): DeviceService {
    return new DeviceServiceImplementation(
      RepositoryFacade.createDeviceRepository(),
      EventEmitterFacade.createDeviceEventEmitter()
    )
  }
}
