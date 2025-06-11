import { RundownService } from '../../rundown-execution/application/interfaces/rundown-service'
import { RundownTimelineService } from '../../rundown-execution/application/services/rundown-timeline-service'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { TimelineBuilder } from '../../rundown-execution/domain/interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../../rundown-execution/domain/services/superfly-timeline-builder'
import { TimeoutCallbackScheduler } from '../../cross-cutting-concerns/application/services/timeout-callback-scheduler'
import { BlueprintsFacade } from '../../blueprints/blueprints-facade'
import { ActionService } from '../../action-system/application/interfaces/action-service'
import { ExecuteActionService } from '../../action-system/application/services/execute-action-service'
import { EventEmitterFacade } from '../../presentation/facades/event-emitter-facade'
import { DataChangeService } from '../../rundown-execution/application/interfaces/data-change-service'
import { BlueprintTimelineBuilder } from '../../rundown-execution/domain/services/blueprint-timeline-builder'
import { IngestService } from '../../sofie-ingest/application/ingest-service'
import { Tv2INewsIngestService } from '../../sofie-ingest/application/tv2-inews-ingest-service'
import { HttpService } from '../../cross-cutting-concerns/application/interfaces/http-service'
import { GotHttpService } from '../../cross-cutting-concerns/infrastructure/services/got-http-service'
import { IngestedEntityToEntityMapper } from '../../sofie-ingest/domain/services/ingested-entity-to-entity-mapper'
import { TriggerService } from '../../action-system/application/interfaces/trigger-service'
import { TriggerServiceImplementation } from '../../action-system/application/services/trigger-service-implementation'
import { LoggerFacade } from '../../cross-cutting-concerns/application/logger-facade'
import { MediaDatabaseChangedService } from '../../sofie-ingest/application/media-database-changed-service'
import { ConfigurationService } from '../../rundown-execution/application/interfaces/configuration-service'
import { ConfigurationServiceImplementation } from '../../rundown-execution/application/services/configuration-service-implementation'
import { DeviceChangedService } from '../../sofie-ingest/application/device-changed-service'
import { ConfigurationChangedService } from '../../sofie-ingest/application/configuration-changed-service'
import { StatusMessageService } from '../../cross-cutting-concerns/application/interfaces/status-message-service'
import { StatusMessageServiceImplementation } from '../../cross-cutting-concerns/application/services/status-message-service-implementation'
import { PlayoutService } from '../../rundown-execution/application/interfaces/playout-service'
import { PlayoutGatewayService } from '../../rundown-execution/application/services/playout-gateway-service'
import { ThrottledRundownService } from '../../rundown-execution/application/services/throttled-rundown-service'
import { IngestRundownSynchronizer } from '../../sofie-ingest/application/ingest-rundown-synchronizer'
import { EntityChangeDetector } from '../../sofie-ingest/domain/services/entity-change-detector'
import { IngestDataChangeService } from '../../sofie-ingest/application/ingest-data-change-service'
import { ActionGenerationService } from '../../action-system/application/services/action-generation-service'
import { SynchronizedRundownService } from '../../rundown-execution/application/services/synchronized-rundown-service'
import { AsyncLock } from '../../cross-cutting-concerns/application/services/async-lock'
import { MacroServiceImplementation } from '../../action-system/application/services/macro-service-implementation'
import { MacroService } from '../../action-system/application/interfaces/macro-service'
import { HelperFacade } from '../../cross-cutting-concerns/application/helper-facade'
import { PlayoutContentReadService, PlayoutContentUpdateService } from '../../rundown-execution/application/interfaces/playout-content-service'
import { PlayoutContentStateService } from '../../rundown-execution/application/services/playout-content-state-service'

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
      ServiceFacade.createPlayoutContentUpdateService(),
      LoggerFacade.createLogger(),
    )
    return ThrottledRundownService.getInstance(new SynchronizedRundownService(rundownTimelineService, this.rundownLock))
  }

  public static createTimelineBuilder(): TimelineBuilder {
    const superflyTimelineBuilder: TimelineBuilder = new SuperflyTimelineBuilder(HelperFacade.createObjectCloner())
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
      BlueprintsFacade.createBlueprint(),
      ServiceFacade.createPlayoutContentReadService()
    )
  }

  public static createMacroService(): MacroService {
    return new MacroServiceImplementation(EventEmitterFacade.createStatusMessageEventEmitter(), EventEmitterFacade.createMacroEventEmitter(), RepositoryFacade.createMacroRepository(), ServiceFacade.createActionService())
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
    return new IngestRundownSynchronizer(
      new IngestedEntityToEntityMapper(),
      ServiceFacade.createEntityChangeDetector(),
      BlueprintsFacade.createBlueprint(),
      RepositoryFacade.createConfigurationRepository()
    )
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

  public static createPlayoutContentUpdateService(): PlayoutContentUpdateService {
    return PlayoutContentStateService.getInstance(
      EventEmitterFacade.createPlayoutContentEventEmitter(),
      RepositoryFacade.createPlayoutContentRepository()
    )
  }

  public static createPlayoutContentReadService(): PlayoutContentReadService {
    return PlayoutContentStateService.getInstance(
      EventEmitterFacade.createPlayoutContentEventEmitter(),
      RepositoryFacade.createPlayoutContentRepository()
    )
  }
}
