import { Logger } from './cross-cutting-concerns/application/interfaces/logger'
import { ConsoleLogger } from './cross-cutting-concerns/infrastructure/services/console-logger'
import { MongoDatabase } from './cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import {
  MongoRundownAggregateRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-rundown-aggregate-repository'
import { MongoSegmentRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-segment-repository'
import { MongoPieceRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-piece-repository'
import { MongoEntityConverter } from './rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'
import { MongoPartRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-part-repository'
import {
  MongoExpectedPlayoutItemRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-expected-playout-item-repository'
import { RundownAggregateRepository } from './rundown-execution/domain/repositories/rundown-aggregate-repository'
import { RundownTimelineService } from './rundown-execution/application/services/rundown-timeline-service'
import { ThrottledRundownService } from './rundown-execution/application/services/throttled-rundown-service'
import { SynchronizedRundownService } from './rundown-execution/application/services/synchronized-rundown-service'
import { AsyncLock } from './cross-cutting-concerns/application/services/async-lock'
import {
  MongoIngestedRundownRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-rundown-repository'
import { IngestedRundownRepository } from './sofie-ingest/domain/repositories/ingested-rundown-repository'
import { IngestedSegmentRepository } from './sofie-ingest/domain/repositories/ingested-segment-repository'
import { IngestedPartRepository } from './sofie-ingest/domain/repositories/ingested-part-repository'
import {
  MongoIngestedPartRepository
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-part-repository'
import { IngestedPieceRepository } from './sofie-ingest/domain/repositories/ingested-piece-repository'
import {
  MongoIngestedEntityConverter
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import {
  MongoIngestedPieceRepository
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-piece-repository'
import {
  MongoIngestedSegmentRepository
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-segment-repository'
import { RundownBaselineRepository } from './rundown-execution/domain/repositories/rundown-baseline-repository'
import {
  MongoRundownBaselineRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-rundown-baseline-repository'
import { TimelineRepository } from './rundown-execution/domain/repositories/timeline-repository'
import {
  MongoTimelineRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-timeline-repository'
import { TimelineBuilder } from './rundown-execution/domain/interfaces/timeline-builder'
import { ObjectCloner } from './cross-cutting-concerns/domain/services/object-cloner'
import { DeepPropertyObjectCloner } from './cross-cutting-concerns/infrastructure/services/deep-property-object-cloner'
import { Blueprint } from './rundown-execution/domain/value-objects/blueprint'
import { Tv2ConfigurationMapper } from './blueprints/domain/services/tv2-configuration-mapper'
import {
  Tv2StudioBlueprintConfigurationMapper
} from './blueprints/domain/services/tv2-studio-blueprint-configuration-mapper'
import {
  Tv2ShowStyleBlueprintConfigurationMapper
} from './blueprints/domain/services/tv2-show-style-blueprint-configuration-mapper'
import { Tv2SisyfosPersistentLayerFinder } from './blueprints/domain/services/tv2-sisyfos-persistent-layer-finder'
import { Tv2Blueprint } from './blueprints/domain/services/tv2-blueprint'
import { Tv2EndStateForPartService } from './blueprints/domain/services/tv2-end-state-for-part-service'
import { Tv2OnTimelineGenerateService } from './blueprints/domain/services/tv2-on-timeline-generate-service'
import { Tv2BlueprintConfigurationValidator } from './blueprints/domain/services/tv2-blueprint-configuration-validator'
import { Tv2BlueprintBaselinePiecesGenerator } from './blueprints/domain/services/tv2-blueprint-baseline-pieces-generator'
import {
  TimelineObjectFactoryProvider
} from './blueprints/domain/services/timeline-object-factories/timeline-object-factory-provider'
import { Tv2ActionService } from './blueprints/domain/services/tv2-action-service'
import { Tv2ActionFactoryProvider } from './blueprints/domain/services/action-factories/tv2-action-factory-provider'
import { ConfigurationRepository } from './rundown-execution/domain/repositories/configuration-repository'
import {
  MongoConfigurationRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-configuration-repository'
import { StudioRepository } from './rundown-execution/domain/repositories/studio-repository'
import { MongoStudioRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-studio-repository'
import { ShowStyleRepository } from './rundown-execution/domain/repositories/show-style-repository'
import {
  MongoShowStyleRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-repository'
import { ShowStyleVariantRepository } from './rundown-execution/domain/repositories/show-style-variant-repository'
import {
  MongoShowStyleVariantRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-variant-repository'
import { BlueprintTimelineBuilder } from './rundown-execution/domain/services/blueprint-timeline-builder'
import { SuperflyTimelineBuilder } from './rundown-execution/domain/services/superfly-timeline-builder'
import { RundownService } from './rundown-execution/application/interfaces/rundown-service'
import { IngestService } from './sofie-ingest/application/interfaces/ingest-service'
import { Tv2INewsIngestService } from './sofie-ingest/application/services/tv2-inews-ingest-service'
import { HttpService } from './cross-cutting-concerns/application/interfaces/http-service'
import { GotHttpService } from './cross-cutting-concerns/infrastructure/services/got-http-service'
import { PlayoutService } from './rundown-execution/application/interfaces/playout-service'
import { PlayoutGatewayService } from './rundown-execution/application/services/playout-gateway-service'
import { TimeoutCallbackScheduler } from './cross-cutting-concerns/application/services/timeout-callback-scheduler'
import { PlayoutContentStateService } from './rundown-execution/application/services/playout-content-state-service'
import {
  MongoPlayoutContentRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-playout-content-repository'
import { PlayoutContentRepository } from './rundown-execution/domain/repositories/playout-content-repository'
import { CallbackScheduler } from './cross-cutting-concerns/application/interfaces/callback-scheduler'
import { PlayoutContentEventEmitter } from './rundown-execution/application/interfaces/playout-content-event-emitter'
import { PlayoutContentEventService } from './rundown-execution/application/services/playout-content-event-service'
import { RundownExecutionEventBuilder } from './rundown-execution/application/services/rundown-execution-event-builder'
import { RundownEventService } from './rundown-execution/application/services/rundown-event-service'
import { RundownController } from './rundown-execution/application/controllers/rundown-controller'
import { HttpErrorHandler } from './cross-cutting-concerns/application/interfaces/http-error-handler'
import { ExpressErrorHandler } from './cross-cutting-concerns/application/services/express-error-handler'
import { JsendResponseFormatter } from './cross-cutting-concerns/application/services/jsend-response-formatter'
import { ExpressRestServer } from './cross-cutting-concerns/infrastructure/services/express-rest-server'
import { LoggerController } from './cross-cutting-concerns/application/controllers/logger-controller'
import { TimelineController } from './rundown-execution/application/controllers/timeline-controller'
import { ActionController } from './action-system/application/controllers/action-controller'
import { ActionService } from './action-system/application/interfaces/action-service'
import { ExecuteActionService } from './action-system/application/services/execute-action-service'
import { ActionRepository } from './action-system/domain/repositories/action-repository'
import { MongoActionRepository } from './action-system/infrastructure/repositories/mongodb/mongo-action-repository'
import { MediaRepository } from './rundown-execution/domain/repositories/media-repository'
import { MongoMediaRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-media-repository'
import { TriggerController } from './action-system/application/controllers/trigger-controller'
import { TriggerService } from './action-system/application/interfaces/trigger-service'
import { TriggerServiceImplementation } from './action-system/application/services/trigger-service-implementation'
import { ActionSystemEventBuilder } from './action-system/application/services/action-system-event-builder'
import { TriggerEventService } from './action-system/application/services/trigger-event-service'
import { TriggerRepository } from './action-system/domain/repositories/trigger-repository'
import { MongoTriggerRepository } from './action-system/infrastructure/repositories/mongodb/mongo-trigger-repository'
import { UuidGenerator } from './cross-cutting-concerns/infrastructure/interfaces/uuid-generator'
import { CryptoUuidGenerator } from './cross-cutting-concerns/infrastructure/services/crypto-uuid-generator'
import { ConfigurationController } from './rundown-execution/application/controllers/configuration-controller'
import { ConfigurationService } from './rundown-execution/application/interfaces/configuration-service'
import {
  ConfigurationServiceImplementation
} from './rundown-execution/application/services/configuration-service-implementation'
import { ConfigurationEventService } from './rundown-execution/application/services/configuration-event-service'
import { ShelfConfigurationRepository } from './rundown-execution/domain/repositories/shelf-configuration-repository'
import { MongoShelfRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-shelf-repository'
import { MediaController } from './rundown-execution/application/controllers/media-controller'
import {
  SystemInformationController
} from './cross-cutting-concerns/application/controllers/system-information-controller'
import { SystemInformationRepository } from './cross-cutting-concerns/domain/repositories/system-information-repository'
import {
  MongoSystemInformationRepository
} from './cross-cutting-concerns/infrastructure/mongodb/mongo-system-information-repository'
import { StatusMessageRepository } from './cross-cutting-concerns/domain/repositories/status-message-repository'
import {
  MongoStatusMessageRepository
} from './cross-cutting-concerns/infrastructure/mongodb/mongo-status-message-repository'
import { DeviceController } from './rundown-execution/application/controllers/device-controller'
import { VideoMixerDeviceRepository } from './rundown-execution/domain/repositories/video-mixer-device-repository'
import {
  MongoVideoMixerDeviceRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-video-mixer-device-repository'
import { DeviceEventService } from './rundown-execution/application/services/device-event-service'
import { MacroController } from './action-system/application/controllers/macro-controller'
import { MacroService } from './action-system/application/interfaces/macro-service'
import { MacroServiceImplementation } from './action-system/application/services/macro-service-implementation'
import { StatusMessageEventService } from './cross-cutting-concerns/application/services/status-message-event-service'
import {
  CrossCuttingConcernsEventBuilder
} from './cross-cutting-concerns/application/services/cross-cutting-concerns-event-builder'
import { MacroEventService } from './action-system/application/services/macro-event-service'
import { MacroRepository } from './action-system/domain/repositories/macro-repository'
import { MongoMacroRepository } from './action-system/infrastructure/repositories/mongodb/mongo-macro-repository'
import { EventServer } from './cross-cutting-concerns/infrastructure/interfaces/event-server'
import { WebSocketEventServer } from './cross-cutting-concerns/application/services/web-socket-event-server'
import { ActionEventService } from './action-system/application/services/action-event-service'
import { MediaEventService } from './sofie-ingest/application/services/media-event-service'
import { SofieIngestEventBuilder } from './sofie-ingest/application/services/sofie-ingest-event-builder'
import {
  MongoIngestedRundownChangedListener
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-rundown-changed-listener'
import {
  MongoIngestedSegmentChangedListener
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-segment-changed-listener'
import {
  MongoIngestedPartChangedListener
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-part-changed-listener'
import {
  MongoIngestedPieceChangedListener
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-piece-changed-listener'
import { IngestDataChangeService } from './sofie-ingest/application/services/ingest-data-change-service'
import { IngestRundownSynchronizer } from './sofie-ingest/application/services/ingest-rundown-synchronizer'
import { EntityChangeDetector } from './sofie-ingest/domain/services/entity-change-detector'
import { IngestedEntityToEntityMapper } from './sofie-ingest/domain/services/ingested-entity-to-entity-mapper'
import { RundownEventEmitter } from './rundown-execution/application/interfaces/rundown-event-emitter'
import { ActionGenerationService } from './action-system/application/services/action-generation-service'
import { ActionManifestRepository } from './action-system/domain/repositories/action-manifest-repository'
import {
  MongoActionManifestRepository
} from './action-system/infrastructure/repositories/mongodb/mongo-action-manifest-repository'
import {
  MongoAdLibActionsRepository
} from './action-system/infrastructure/repositories/mongodb/mongo-ad-lib-actions-repository'
import {
  MongoAdLibPieceRepository
} from './action-system/infrastructure/repositories/mongodb/mongo-ad-lib-piece-repository'
import { MediaDatabaseChangedService } from './sofie-ingest/application/services/media-database-changed-service'
import {
  MongoDeviceChangedListener
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-device-changed-listener'
import {
  MongoMediaChangedListener
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-media-changed-listener'
import { MediaEventEmitter } from './rundown-execution/application/interfaces/media-event-emitter'
import { DeviceChangedService } from './sofie-ingest/application/services/device-changed-service'
import { DeviceRepository } from './rundown-execution/domain/repositories/device-repository'
import { StatusMessageService } from './cross-cutting-concerns/application/interfaces/status-message-service'
import {
  StatusMessageServiceImplementation
} from './cross-cutting-concerns/application/services/status-message-service-implementation'
import { MongoDeviceRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-device-repository'
import { ConfigurationChangedService } from './sofie-ingest/application/services/configuration-changed-service'
import {
  MongoShowStyleChangedListener
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-changed-listener'
import {
  MongoShowStyleVariantConfigurationListener
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-variant-configuration-listener'
import {
  CachedRundownAggregateRepository
} from './rundown-execution/infrastructure/repositories/cache/cached-rundown-aggregate-repository'
import {
  CachedConfigurationRepository
} from './rundown-execution/infrastructure/repositories/cache/cached-configuration-repository'
import { StringHashGenerator } from './blueprints/domain/interfaces/string-hash-generator'
import { CryptoStringHashGenerator } from './blueprints/infrastructure/services/crypto-string-hash-generator'

async function main(logger: Logger): Promise<void> {
  const uuidGenerator: UuidGenerator = new CryptoUuidGenerator()
  const objectCloner: ObjectCloner = new DeepPropertyObjectCloner()
  const httpService: HttpService = new GotHttpService()
  const timeoutCallbackScheduler: CallbackScheduler = new TimeoutCallbackScheduler(logger)

  // Repository setup
  const mongoDatabase: MongoDatabase = new MongoDatabase(logger)
  const mongoEntityConverter: MongoEntityConverter = new MongoEntityConverter(logger)

  const systemInformationRepository: SystemInformationRepository = new MongoSystemInformationRepository(mongoDatabase, mongoEntityConverter)
  const statusMessageRepository: StatusMessageRepository = new MongoStatusMessageRepository(mongoDatabase)

  const rundownAggregateRepository: RundownAggregateRepository = createRundownAggregateRepository(mongoDatabase, mongoEntityConverter, logger)
  const rundownBaselineRepository: RundownBaselineRepository = new MongoRundownBaselineRepository(mongoDatabase)
  const deviceRepository: DeviceRepository = new MongoDeviceRepository(mongoDatabase, uuidGenerator)
  const ingestedRundownRepository: IngestedRundownRepository = createIngestedRundownRepository(mongoDatabase, rundownBaselineRepository)
  const timelineRepository: TimelineRepository = new MongoTimelineRepository(mongoDatabase, mongoEntityConverter)
  const showStyleVariantRepository: ShowStyleVariantRepository = new MongoShowStyleVariantRepository(mongoDatabase, mongoEntityConverter, rundownAggregateRepository)
  const configurationRepository: ConfigurationRepository = createConfigurationRepository(mongoDatabase, mongoEntityConverter, showStyleVariantRepository)
  const shelfConfigurationRepository: ShelfConfigurationRepository = new MongoShelfRepository(mongoDatabase, uuidGenerator)
  const mediaRepository: MediaRepository = new MongoMediaRepository(mongoDatabase, mongoEntityConverter)

  const actionRepository: ActionRepository = new MongoActionRepository(mongoEntityConverter, mongoDatabase)
  const triggerRepository: TriggerRepository = new MongoTriggerRepository(mongoDatabase, uuidGenerator)
  const macroRepository: MacroRepository = new MongoMacroRepository(mongoDatabase, uuidGenerator)
  const actionManifestRepository: ActionManifestRepository = createActionManifestRepository(mongoDatabase)

  // Event builders and event services
  const rundownExecutionEventBuilder: RundownExecutionEventBuilder = new RundownExecutionEventBuilder()
  const rundownEventService: RundownEventService = new RundownEventService(rundownExecutionEventBuilder)
  const configurationEventService: ConfigurationEventService = new ConfigurationEventService(rundownExecutionEventBuilder)
  const deviceEventService: DeviceEventService = new DeviceEventService(rundownExecutionEventBuilder)
  const playoutContentEventService: PlayoutContentEventService = new PlayoutContentEventService(rundownExecutionEventBuilder)

  const crossCuttingConcernsEventBuilder: CrossCuttingConcernsEventBuilder = new CrossCuttingConcernsEventBuilder()
  const statusMessageEventService: StatusMessageEventService = new StatusMessageEventService(crossCuttingConcernsEventBuilder)

  const actionSystemEventBuilder: ActionSystemEventBuilder = new ActionSystemEventBuilder()
  const actionEventService: ActionEventService = new ActionEventService(actionSystemEventBuilder)
  const triggerEventService: TriggerEventService = new TriggerEventService(actionSystemEventBuilder)
  const macroEventService: MacroEventService = new MacroEventService(actionSystemEventBuilder)

  const sofieIngestEventBuilder: SofieIngestEventBuilder = new SofieIngestEventBuilder()
  const mediaEventService: MediaEventService = new MediaEventService(sofieIngestEventBuilder)

  // Data change listeners
  const videoMixerDeviceRepository: VideoMixerDeviceRepository = new MongoVideoMixerDeviceRepository(mongoDatabase, deviceEventService)

  // Shared resources
  const rundownAsyncLock: AsyncLock = new AsyncLock(logger)

  // Services
  const blueprint: Blueprint = createBlueprint(objectCloner, logger)
  const timelineBuilder: TimelineBuilder = createTimelineBuilder(objectCloner, configurationRepository, blueprint)
  const ingestService: IngestService = new Tv2INewsIngestService(httpService, rundownAggregateRepository)
  const playoutService: PlayoutService = new PlayoutGatewayService(httpService, logger)
  const playoutContentStateService: PlayoutContentStateService = createPlayoutContentStateService(mongoDatabase, playoutContentEventService)
  const rundownTimelineService: RundownTimelineService = new RundownTimelineService(rundownEventService, ingestedRundownRepository, rundownAggregateRepository, timelineRepository, timelineBuilder, ingestService, playoutService, timeoutCallbackScheduler, blueprint, playoutContentStateService, logger)
  const synchronizedRundownService: SynchronizedRundownService = new SynchronizedRundownService(rundownTimelineService, rundownAsyncLock)
  const rundownService: RundownService = new ThrottledRundownService(synchronizedRundownService)
  const actionService: ActionService = new ExecuteActionService(actionRepository, rundownAggregateRepository, mediaRepository, configurationRepository, rundownService, blueprint, playoutContentStateService)
  const triggerService: TriggerService = new TriggerServiceImplementation(triggerEventService, triggerRepository)
  const macroService: MacroService = new MacroServiceImplementation(statusMessageEventService, macroEventService, macroRepository, actionService)
  const configurationService: ConfigurationService = new ConfigurationServiceImplementation(configurationEventService, shelfConfigurationRepository)
  const actionGenerationService: ActionGenerationService = new ActionGenerationService(configurationRepository, actionManifestRepository, actionRepository, actionEventService, blueprint)
  const ingestDataChangeService: IngestDataChangeService = createIngestChangeService(mongoDatabase, ingestedRundownRepository, rundownAggregateRepository, rundownAsyncLock, blueprint, configurationRepository, rundownEventService, timelineBuilder, timelineRepository, actionGenerationService, logger)
  const mediaDataChangeService: MediaDatabaseChangedService = createMediaDataChangeService(mongoDatabase, mediaRepository, mediaEventService, logger)
  const statusMessageService: StatusMessageService = new StatusMessageServiceImplementation(statusMessageEventService, statusMessageRepository)
  const deviceDataChangeService: DeviceChangedService = createDeviceDataChangeService(mongoDatabase, mongoEntityConverter, statusMessageService, deviceRepository, logger)
  const configurationDataChangeService: ConfigurationChangedService = createConfigurationDataChangeService(mongoDatabase, blueprint, statusMessageService, configurationRepository, logger)

  // Controller setup
  const httpResponseFormatter: JsendResponseFormatter = new JsendResponseFormatter()
  const httpErrorHandler: HttpErrorHandler = new ExpressErrorHandler(httpResponseFormatter, logger)

  const rundownController: RundownController = new RundownController(rundownService, rundownAggregateRepository, ingestService, playoutContentStateService, httpErrorHandler, httpResponseFormatter, logger)
  const timelineController: TimelineController = new TimelineController(timelineRepository, httpErrorHandler, httpResponseFormatter)
  const actionController: ActionController = new ActionController(actionService, httpErrorHandler, httpResponseFormatter)
  const triggerController: TriggerController = new TriggerController(triggerService, httpErrorHandler, httpResponseFormatter)
  const macroController: MacroController = new MacroController(macroService, httpErrorHandler, httpResponseFormatter)
  const configurationController: ConfigurationController = new ConfigurationController(configurationService, configurationRepository, showStyleVariantRepository, shelfConfigurationRepository, httpErrorHandler, httpResponseFormatter)
  const mediaController: MediaController = new MediaController(mediaRepository, httpErrorHandler, httpResponseFormatter)
  const systemInformationController: SystemInformationController = new SystemInformationController(systemInformationRepository, statusMessageRepository, httpErrorHandler, httpResponseFormatter)
  const loggerController: LoggerController = new LoggerController(httpResponseFormatter, httpErrorHandler, logger)
  const deviceController: DeviceController = new DeviceController(videoMixerDeviceRepository, httpErrorHandler, httpResponseFormatter)

  // System setup
  const restServer: ExpressRestServer = new ExpressRestServer([rundownController, timelineController, actionController, triggerController, macroController, configurationController, mediaController, deviceController, systemInformationController, loggerController], logger)
  const eventServer: EventServer = new WebSocketEventServer(rundownEventService, actionEventService, triggerEventService, macroEventService, mediaEventService, configurationEventService, statusMessageEventService, deviceEventService, playoutContentEventService, logger)

  // System startup
  await mongoDatabase.connect()
  await ingestDataChangeService.initialize()
  await playoutContentStateService.initialize()
  await mediaDataChangeService.initialize()
  await deviceDataChangeService.initialize()
  await configurationDataChangeService.initialize()
  await restServer.start(3005)
  await eventServer.startServer(3006)
  logger.info('Alba server is configured.')
}

function createRundownAggregateRepository(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter, logger: Logger): RundownAggregateRepository {
  const mongoExpectedPlayoutItemRepository: MongoExpectedPlayoutItemRepository = new MongoExpectedPlayoutItemRepository(mongoDatabase)

  const mongoPieceRepository: MongoPieceRepository = new MongoPieceRepository(mongoDatabase, mongoEntityConverter)
  const mongoPartRepository: MongoPartRepository = new MongoPartRepository(mongoDatabase, mongoPieceRepository, mongoEntityConverter)
  const mongoSegmentRepository: MongoSegmentRepository = new MongoSegmentRepository(mongoDatabase, mongoPartRepository, mongoEntityConverter)
  const mongoRundownAggregateRepository: MongoRundownAggregateRepository = new MongoRundownAggregateRepository(mongoDatabase, mongoSegmentRepository, mongoPartRepository, mongoPieceRepository, mongoExpectedPlayoutItemRepository, mongoEntityConverter)
  return new CachedRundownAggregateRepository(mongoRundownAggregateRepository, logger)
}

function createIngestedRundownRepository(mongoDatabase: MongoDatabase, rundownBaselineRepository: RundownBaselineRepository): IngestedRundownRepository {
  const ingestedEntityConverter: MongoIngestedEntityConverter = new MongoIngestedEntityConverter()
  const ingestedPieceRepository: IngestedPieceRepository = new MongoIngestedPieceRepository(mongoDatabase, ingestedEntityConverter)
  const ingestedPartRepository: IngestedPartRepository = new MongoIngestedPartRepository(mongoDatabase, ingestedEntityConverter, ingestedPieceRepository)
  const ingestedSegmentRepository: IngestedSegmentRepository = new MongoIngestedSegmentRepository(mongoDatabase, ingestedEntityConverter, ingestedPartRepository)
  return new MongoIngestedRundownRepository(mongoDatabase, ingestedEntityConverter, rundownBaselineRepository, ingestedSegmentRepository, ingestedPartRepository, ingestedPieceRepository)
}

function createBlueprint(objectCloner: ObjectCloner, logger: Logger): Blueprint {
  const configurationMapper: Tv2ConfigurationMapper = new Tv2ConfigurationMapper(
    new Tv2StudioBlueprintConfigurationMapper(),
    new Tv2ShowStyleBlueprintConfigurationMapper()
  )
  const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = new Tv2SisyfosPersistentLayerFinder()
  const timelineObjectFactoryProvider: TimelineObjectFactoryProvider = new TimelineObjectFactoryProvider(logger)

  const stringHashGenerator: StringHashGenerator = new CryptoStringHashGenerator()
  const tv2ActionService: Tv2ActionService = new Tv2ActionService(
    configurationMapper,
    new Tv2ActionFactoryProvider(configurationMapper, timelineObjectFactoryProvider, stringHashGenerator, objectCloner, logger),
    logger
  )

  return new Tv2Blueprint(
    new Tv2EndStateForPartService(sisyfosPersistentLayerFinder),
    new Tv2OnTimelineGenerateService(configurationMapper, sisyfosPersistentLayerFinder),
    tv2ActionService,
    new Tv2BlueprintConfigurationValidator(configurationMapper),
    new Tv2BlueprintBaselinePiecesGenerator(new Tv2StudioBlueprintConfigurationMapper(), timelineObjectFactoryProvider)
  )
}

function createConfigurationRepository(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter, showStyleVariantRepository: ShowStyleVariantRepository): ConfigurationRepository {
  const studioRepository: StudioRepository = new MongoStudioRepository(mongoDatabase, mongoEntityConverter)
  const showStyleRepository: ShowStyleRepository = new MongoShowStyleRepository(mongoDatabase, showStyleVariantRepository, mongoEntityConverter)
  const mongoConfigurationRepository: MongoConfigurationRepository = new MongoConfigurationRepository(studioRepository, showStyleRepository)
  return new CachedConfigurationRepository(mongoConfigurationRepository)
}

function createActionManifestRepository(mongoDatabase: MongoDatabase): ActionManifestRepository {
  const adLibActionManifestRepository: MongoAdLibActionsRepository = new MongoAdLibActionsRepository(mongoDatabase)
  const adLibPieceManifestRepository: MongoAdLibPieceRepository = new MongoAdLibPieceRepository(mongoDatabase)
  return new MongoActionManifestRepository([adLibActionManifestRepository, adLibPieceManifestRepository])
}

function createTimelineBuilder(objectCloner: ObjectCloner, configurationRepository: ConfigurationRepository, blueprint: Blueprint): TimelineBuilder {
  const superflyTimelineBuilder: SuperflyTimelineBuilder = new SuperflyTimelineBuilder(objectCloner)
  return new BlueprintTimelineBuilder(superflyTimelineBuilder, configurationRepository, blueprint)
}

function createPlayoutContentStateService(mongoDatabase: MongoDatabase, playoutContentEventEmitter: PlayoutContentEventEmitter): PlayoutContentStateService {
  const playoutContentRepository: PlayoutContentRepository = new MongoPlayoutContentRepository(mongoDatabase)
  return new PlayoutContentStateService(playoutContentEventEmitter, playoutContentRepository)
}

function createIngestChangeService(mongoDatabase: MongoDatabase, ingestedRundownRepository: IngestedRundownRepository, rundownAggregateRepository: RundownAggregateRepository, rundownAsyncLock: AsyncLock, blueprint: Blueprint, configurationRepository: ConfigurationRepository, rundownEventEmitter: RundownEventEmitter, timelineBuilder: TimelineBuilder, timelineRepository: TimelineRepository, actionGenerationService: ActionGenerationService, logger: Logger): IngestDataChangeService {
  const ingestedMongoEntityConverter: MongoIngestedEntityConverter = new MongoIngestedEntityConverter()
  const ingestedRundownChangeListener: MongoIngestedRundownChangedListener = new MongoIngestedRundownChangedListener(mongoDatabase, ingestedMongoEntityConverter, logger)
  const ingestedSegmentChangeListener: MongoIngestedSegmentChangedListener = new MongoIngestedSegmentChangedListener(mongoDatabase, ingestedMongoEntityConverter, logger)
  const ingestedPartChangeListener: MongoIngestedPartChangedListener = new MongoIngestedPartChangedListener(mongoDatabase, ingestedMongoEntityConverter, logger)
  const ingestedPieceChangeListener: MongoIngestedPieceChangedListener = new MongoIngestedPieceChangedListener(mongoDatabase, ingestedMongoEntityConverter, logger)
  const entityChangeDetector: EntityChangeDetector = new EntityChangeDetector()
  const ingestedEntityToEntityMapper: IngestedEntityToEntityMapper = new IngestedEntityToEntityMapper()
  const ingestRundownSynchronizer: IngestRundownSynchronizer = new IngestRundownSynchronizer(ingestedEntityToEntityMapper, entityChangeDetector, blueprint, configurationRepository)
  return new IngestDataChangeService(
    ingestedRundownRepository,
    rundownAggregateRepository,
    rundownAsyncLock,
    rundownAggregateRepository,
    rundownAggregateRepository,
    rundownAggregateRepository,
    ingestedRundownChangeListener,
    ingestedSegmentChangeListener,
    ingestedPartChangeListener,
    ingestedPieceChangeListener,
    ingestRundownSynchronizer,
    ingestedEntityToEntityMapper,
    rundownEventEmitter,
    timelineBuilder,
    timelineRepository,
    actionGenerationService,
    logger
  )
}

function createMediaDataChangeService(mongoDatabase: MongoDatabase, mediaRepository: MediaRepository, mediaEventEmitter: MediaEventEmitter, logger: Logger): MediaDatabaseChangedService {
  const mediaDataChangeListener: MongoMediaChangedListener = new MongoMediaChangedListener(mongoDatabase, logger, mediaRepository)
  return new MediaDatabaseChangedService(mediaEventEmitter, mediaDataChangeListener)
}

function createDeviceDataChangeService(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter, statusMessageService: StatusMessageService, deviceRepository: DeviceRepository, logger: Logger): DeviceChangedService {
  const deviceChangeListener: MongoDeviceChangedListener = new MongoDeviceChangedListener(mongoDatabase, mongoEntityConverter, logger)
  return new DeviceChangedService(statusMessageService, deviceRepository, deviceChangeListener, logger)
}

function createConfigurationDataChangeService(mongoDatabase: MongoDatabase, blueprint: Blueprint, statusMessageService: StatusMessageService, configurationRepository: ConfigurationRepository, logger: Logger): ConfigurationChangedService {
  const showStyleConfigurationDataChangeListener: MongoShowStyleChangedListener = new MongoShowStyleChangedListener(mongoDatabase, logger)
  const showStyleVariantConfigurationChangedListener: MongoShowStyleVariantConfigurationListener = new MongoShowStyleVariantConfigurationListener(mongoDatabase, logger)
  return new ConfigurationChangedService(blueprint, statusMessageService, configurationRepository, showStyleConfigurationDataChangeListener, showStyleVariantConfigurationChangedListener, logger)
}

const consoleLogger: Logger = new ConsoleLogger().tag('startup')
main(consoleLogger).catch(error => consoleLogger.data(error).error('Failed starting up Alba server.'))
