import { Logger } from './cross-cutting-concerns/application/interfaces/logger'
import { ConsoleLogger } from './cross-cutting-concerns/infrastructure/services/console-logger'
import { MongoDatabase } from './cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import {
  MongoRundownAggregateRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-rundown-aggregate-repository'
import {
  MongoSegmentRepository
} from './rundown-execution/infrastructure/repositories/mongodb/mongo-segment-repository'
import { MongoPieceRepository } from './rundown-execution/infrastructure/repositories/mongodb/mongo-piece-repository'
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
import { DeepObjectCloner } from './cross-cutting-concerns/domain/services/deep-object-cloner'
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
import {
  Tv2BlueprintBaselinePiecesGenerator
} from './blueprints/domain/services/tv2-blueprint-baseline-pieces-generator'
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
import { SuperTimelineBuilder } from './rundown-execution/domain/services/super-timeline-builder'
import { RundownService } from './rundown-execution/application/interfaces/rundown-service'
import { SofieIngestService } from './sofie-ingest/application/interfaces/sofie-ingest-service'
import { Tv2InewsSofieIngestService } from './sofie-ingest/application/services/tv2-inews-sofie-ingest-service'
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
import { MediaRepository } from './sofie-ingest/domain/repositories/media-repository'
import { MongoMediaRepository } from './sofie-ingest/infrastructure/repositories/mongodb/mongo-media-repository'
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
import { MediaController } from './sofie-ingest/application/controllers/media-controller'
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
import { DeviceController } from './sofie-ingest/application/controllers/device-controller'
import { VideoMixerDeviceRepository } from './sofie-ingest/domain/repositories/video-mixer-device-repository'
import {
  MongoVideoMixerDeviceRepository
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-video-mixer-device-repository'
import { DeviceEventService } from './sofie-ingest/application/services/device-event-service'
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
import { WebSocketEventServer } from './cross-cutting-concerns/infrastructure/services/web-socket-event-server'
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
import { IngestRundownSynchronizer } from './sofie-ingest/domain/services/ingest-rundown-synchronizer'
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
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-device-changed-listener'
import {
  MongoMediaChangedListener
} from './sofie-ingest/infrastructure/repositories/mongodb/mongo-media-changed-listener'
import { MediaEventEmitter } from './sofie-ingest/application/interfaces/media-event-emitter'
import { DeviceChangedService } from './sofie-ingest/application/services/device-changed-service'
import { DeviceRepository } from './sofie-ingest/domain/repositories/device-repository'
import { StatusMessageService } from './cross-cutting-concerns/application/interfaces/status-message-service'
import {
  StatusMessageServiceImplementation
} from './cross-cutting-concerns/application/services/status-message-service-implementation'
import { MongoDeviceRepository } from './sofie-ingest/infrastructure/repositories/mongodb/mongo-device-repository'
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
import {
  RundownExecutionMongoEntityConverter
} from './rundown-execution/infrastructure/repositories/mongodb/rundown-execution-mongo-entity-converter'
import {
  CrossCuttingConcernsMongoEntityConverter
} from './cross-cutting-concerns/infrastructure/mongodb/cross-cutting-concerns-mongo-entity-converter'
import {
  ActionSystemMongoEntityConverter
} from './action-system/infrastructure/repositories/mongodb/action-system-mongo-entity-converter'
import {
  SofieIngestMongoEntityConverter
} from './sofie-ingest/infrastructure/repositories/mongodb/sofie-ingest-mongo-entity-converter'
import { TypedEventBus } from './cross-cutting-concerns/application/services/typed-event-bus'
import { TypedEventServer } from './cross-cutting-concerns/application/services/typed-event-server'
import { IngestGatewayConnector } from './rundown-ingest/application/interfaces/ingest-gateway-connector'
import { InewsGatewayConnector } from './tv2-inews-ingest/infrastructure/services/inews-gateway-connector'
import { ReconnectingWebSocket } from './cross-cutting-concerns/infrastructure/services/reconnecting-web-socket'
import { IngestHealthStatusEventService } from './rundown-ingest/application/services/ingest-health-status-event-service'
import { RundownIngestEventBuilder } from './rundown-ingest/application/services/rundown-ingest-event-builder'
import { IngestController } from './rundown-ingest/application/controllers/ingest-controller'
import {
  InewsIngestConfigurationRepository
} from './tv2-inews-ingest/domain/repositories/inews-ingest-configuration-repository'
import {
  MongoInewsIngestConfigurationRepository
} from './tv2-inews-ingest/infrastructure/repositories/mongo/mongo-inews-ingest-configuration-repository'
import { Tv2InewsIngestController } from './tv2-inews-ingest/application/controllers/tv2-inews-ingest-controller'
import { InewsIngestService } from './tv2-inews-ingest/application/services/inews-ingest-service'
import {
  InewsIngestConfigurationEventBuilder
} from './tv2-inews-ingest/application/interfaces/inews-ingest-configuration-event-builder'
import { Tv2InewsIngestEventBuilder } from './tv2-inews-ingest/application/services/tv2-inews-ingest-event-builder'
import {
  InewsIngestConfigurationEventService
} from './tv2-inews-ingest/application/services/inews-ingest-configuration-event-service'

async function main(logger: Logger): Promise<void> {
  const uuidGenerator: UuidGenerator = new CryptoUuidGenerator()
  const objectCloner: DeepObjectCloner = new DeepPropertyObjectCloner()
  const httpService: HttpService = new GotHttpService()
  const timeoutCallbackScheduler: CallbackScheduler = new TimeoutCallbackScheduler(logger)

  // Repository setup
  const mongoDatabase: MongoDatabase = new MongoDatabase(logger)

  const mongoCrossCuttingConcernsEntityConverter: CrossCuttingConcernsMongoEntityConverter = new CrossCuttingConcernsMongoEntityConverter()
  const systemInformationRepository: SystemInformationRepository = new MongoSystemInformationRepository(mongoDatabase, mongoCrossCuttingConcernsEntityConverter)
  const statusMessageRepository: StatusMessageRepository = new MongoStatusMessageRepository(mongoDatabase)

  const mongoRundownExecutionEntityConverter: RundownExecutionMongoEntityConverter = new RundownExecutionMongoEntityConverter(logger)
  const rundownAggregateRepository: RundownAggregateRepository = createRundownAggregateRepository(mongoDatabase, mongoRundownExecutionEntityConverter, logger)
  const rundownBaselineRepository: RundownBaselineRepository = new MongoRundownBaselineRepository(mongoDatabase)
  const timelineRepository: TimelineRepository = new MongoTimelineRepository(mongoDatabase, mongoRundownExecutionEntityConverter)
  const showStyleVariantRepository: ShowStyleVariantRepository = new MongoShowStyleVariantRepository(mongoDatabase, mongoRundownExecutionEntityConverter, rundownAggregateRepository)
  const configurationRepository: ConfigurationRepository = createConfigurationRepository(mongoDatabase, showStyleVariantRepository, logger)
  const shelfConfigurationRepository: ShelfConfigurationRepository = new MongoShelfRepository(mongoDatabase, uuidGenerator)

  const sofieIngestMongoEntityConverter: SofieIngestMongoEntityConverter = new SofieIngestMongoEntityConverter()
  const mediaRepository: MediaRepository = new MongoMediaRepository(mongoDatabase, sofieIngestMongoEntityConverter)
  const ingestedRundownRepository: IngestedRundownRepository = createIngestedRundownRepository(mongoDatabase, rundownBaselineRepository)
  const deviceRepository: DeviceRepository = new MongoDeviceRepository(mongoDatabase, uuidGenerator)

  const mongoActionSystemEntityConverter: ActionSystemMongoEntityConverter = new ActionSystemMongoEntityConverter()
  const actionRepository: ActionRepository = new MongoActionRepository(mongoActionSystemEntityConverter, mongoDatabase)
  const triggerRepository: TriggerRepository = new MongoTriggerRepository(mongoDatabase, uuidGenerator)
  const macroRepository: MacroRepository = new MongoMacroRepository(mongoDatabase, uuidGenerator)
  const actionManifestRepository: ActionManifestRepository = createActionManifestRepository(mongoDatabase)

  const inewsIngestConfigurationRepository: InewsIngestConfigurationRepository = new MongoInewsIngestConfigurationRepository(mongoDatabase)

  // Event builders and event services
  const typedEventBus: TypedEventBus = new TypedEventBus()
  const rundownExecutionEventBuilder: RundownExecutionEventBuilder = new RundownExecutionEventBuilder()
  const rundownEventService: RundownEventService = new RundownEventService(typedEventBus, rundownExecutionEventBuilder)
  const configurationEventService: ConfigurationEventService = new ConfigurationEventService(typedEventBus, rundownExecutionEventBuilder)
  const playoutContentEventService: PlayoutContentEventService = new PlayoutContentEventService(typedEventBus, rundownExecutionEventBuilder)

  const crossCuttingConcernsEventBuilder: CrossCuttingConcernsEventBuilder = new CrossCuttingConcernsEventBuilder()
  const statusMessageEventService: StatusMessageEventService = new StatusMessageEventService(typedEventBus, crossCuttingConcernsEventBuilder)

  const actionSystemEventBuilder: ActionSystemEventBuilder = new ActionSystemEventBuilder()
  const actionEventService: ActionEventService = new ActionEventService(typedEventBus, actionSystemEventBuilder)
  const triggerEventService: TriggerEventService = new TriggerEventService(typedEventBus, actionSystemEventBuilder)
  const macroEventService: MacroEventService = new MacroEventService(typedEventBus, actionSystemEventBuilder)

  const sofieIngestEventBuilder: SofieIngestEventBuilder = new SofieIngestEventBuilder()
  const mediaEventService: MediaEventService = new MediaEventService(typedEventBus, sofieIngestEventBuilder)
  const deviceEventService: DeviceEventService = new DeviceEventService(typedEventBus, sofieIngestEventBuilder)

  const rundownIngestEventBuilder: RundownIngestEventBuilder = new RundownIngestEventBuilder()
  const healthStatusEventService: IngestHealthStatusEventService = new IngestHealthStatusEventService(typedEventBus, rundownIngestEventBuilder)

  const inewsIngestConfigurationEventBuilder: InewsIngestConfigurationEventBuilder = new Tv2InewsIngestEventBuilder()
  const inewsIngestConfigurationEventService: InewsIngestConfigurationEventService = new InewsIngestConfigurationEventService(typedEventBus, inewsIngestConfigurationEventBuilder)

  // Data change listeners
  const videoMixerDeviceRepository: VideoMixerDeviceRepository = new MongoVideoMixerDeviceRepository(mongoDatabase, deviceEventService)

  // Shared resources
  const rundownAsyncLock: AsyncLock = new AsyncLock(logger)

  // Services
  const blueprint: Blueprint = createBlueprint(objectCloner, logger)
  const timelineBuilder: TimelineBuilder = createTimelineBuilder(objectCloner, blueprint)
  const ingestService: SofieIngestService = new Tv2InewsSofieIngestService(httpService, rundownAggregateRepository)
  const playoutService: PlayoutService = new PlayoutGatewayService(httpService, logger)
  const playoutContentStateService: PlayoutContentStateService = createPlayoutContentStateService(mongoDatabase, playoutContentEventService)
  const rundownTimelineService: RundownTimelineService = new RundownTimelineService(rundownEventService, ingestedRundownRepository, rundownAggregateRepository, timelineRepository, timelineBuilder, configurationRepository, ingestService, playoutService, timeoutCallbackScheduler, blueprint, playoutContentStateService, logger)
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
  const deviceDataChangeService: DeviceChangedService = createDeviceDataChangeService(mongoDatabase, statusMessageService, deviceRepository, logger)
  const configurationDataChangeService: ConfigurationChangedService = createConfigurationDataChangeService(mongoDatabase, blueprint, statusMessageService, configurationRepository, logger)
  const ingestGatewayConnector: IngestGatewayConnector = new InewsGatewayConnector(new ReconnectingWebSocket(logger), healthStatusEventService)
  const inewsIngestService: InewsIngestService = new InewsIngestService(inewsIngestConfigurationRepository, inewsIngestConfigurationEventService, ingestGatewayConnector)

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
  const ingestController: IngestController = new IngestController(ingestGatewayConnector, httpErrorHandler, httpResponseFormatter)
  const tv2InewsIngestController: Tv2InewsIngestController = new Tv2InewsIngestController(inewsIngestService, httpResponseFormatter, httpErrorHandler)

  // System setup
  const restServer: ExpressRestServer = new ExpressRestServer([rundownController, timelineController, actionController, triggerController, macroController, configurationController, mediaController, deviceController, systemInformationController, loggerController, ingestController, tv2InewsIngestController], logger)
  const webSocketEventServer = new WebSocketEventServer(uuidGenerator, logger)
  const typedEventServer: TypedEventServer = new TypedEventServer(webSocketEventServer, typedEventBus, logger)

  // System startup
  await mongoDatabase.connect()
  await ingestDataChangeService.initialize()
  await playoutContentStateService.initialize()
  await mediaDataChangeService.initialize()
  await deviceDataChangeService.initialize()
  await configurationDataChangeService.initialize()
  await inewsIngestService.initialize()
  await restServer.start(3005)
  await typedEventServer.startServer(3006)
  logger.info('Alba server is configured.')
}

function createRundownAggregateRepository(mongoDatabase: MongoDatabase, rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter, logger: Logger): RundownAggregateRepository {
  const mongoExpectedPlayoutItemRepository: MongoExpectedPlayoutItemRepository = new MongoExpectedPlayoutItemRepository(mongoDatabase)

  const mongoPieceRepository: MongoPieceRepository = new MongoPieceRepository(mongoDatabase, rundownExecutionMongoEntityConverter)
  const mongoPartRepository: MongoPartRepository = new MongoPartRepository(mongoDatabase, mongoPieceRepository, rundownExecutionMongoEntityConverter)
  const mongoSegmentRepository: MongoSegmentRepository = new MongoSegmentRepository(mongoDatabase, mongoPartRepository, rundownExecutionMongoEntityConverter)
  const mongoRundownAggregateRepository: MongoRundownAggregateRepository = new MongoRundownAggregateRepository(mongoDatabase, mongoSegmentRepository, mongoPartRepository, mongoPieceRepository, mongoExpectedPlayoutItemRepository, rundownExecutionMongoEntityConverter)
  return new CachedRundownAggregateRepository(mongoRundownAggregateRepository, logger)
}

function createIngestedRundownRepository(mongoDatabase: MongoDatabase, rundownBaselineRepository: RundownBaselineRepository): IngestedRundownRepository {
  const ingestedEntityConverter: MongoIngestedEntityConverter = new MongoIngestedEntityConverter()
  const ingestedPieceRepository: IngestedPieceRepository = new MongoIngestedPieceRepository(mongoDatabase, ingestedEntityConverter)
  const ingestedPartRepository: IngestedPartRepository = new MongoIngestedPartRepository(mongoDatabase, ingestedEntityConverter, ingestedPieceRepository)
  const ingestedSegmentRepository: IngestedSegmentRepository = new MongoIngestedSegmentRepository(mongoDatabase, ingestedEntityConverter, ingestedPartRepository)
  return new MongoIngestedRundownRepository(mongoDatabase, ingestedEntityConverter, rundownBaselineRepository, ingestedSegmentRepository, ingestedPartRepository, ingestedPieceRepository)
}

function createBlueprint(objectCloner: DeepObjectCloner, logger: Logger): Blueprint {
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

function createConfigurationRepository(mongoDatabase: MongoDatabase, showStyleVariantRepository: ShowStyleVariantRepository, logger: Logger): ConfigurationRepository {
  const rundownExecutionMongoEntityConverter: RundownExecutionMongoEntityConverter = new RundownExecutionMongoEntityConverter(logger)
  const studioRepository: StudioRepository = new MongoStudioRepository(mongoDatabase, rundownExecutionMongoEntityConverter)
  const showStyleRepository: ShowStyleRepository = new MongoShowStyleRepository(mongoDatabase, showStyleVariantRepository, rundownExecutionMongoEntityConverter)
  const mongoConfigurationRepository: MongoConfigurationRepository = new MongoConfigurationRepository(studioRepository, showStyleRepository)
  return new CachedConfigurationRepository(mongoConfigurationRepository)
}

function createActionManifestRepository(mongoDatabase: MongoDatabase): ActionManifestRepository {
  const adLibActionManifestRepository: MongoAdLibActionsRepository = new MongoAdLibActionsRepository(mongoDatabase)
  const adLibPieceManifestRepository: MongoAdLibPieceRepository = new MongoAdLibPieceRepository(mongoDatabase)
  return new MongoActionManifestRepository([adLibActionManifestRepository, adLibPieceManifestRepository])
}

function createTimelineBuilder(objectCloner: DeepObjectCloner, blueprint: Blueprint): TimelineBuilder {
  const superTimelineBuilder: SuperTimelineBuilder = new SuperTimelineBuilder(objectCloner)
  return new BlueprintTimelineBuilder(superTimelineBuilder, blueprint)
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
  const ingestRundownSynchronizer: IngestRundownSynchronizer = new IngestRundownSynchronizer(ingestedEntityToEntityMapper, entityChangeDetector, blueprint)
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
    configurationRepository,
    actionGenerationService,
    logger
  )
}

function createMediaDataChangeService(mongoDatabase: MongoDatabase, mediaRepository: MediaRepository, mediaEventEmitter: MediaEventEmitter, logger: Logger): MediaDatabaseChangedService {
  const mediaDataChangeListener: MongoMediaChangedListener = new MongoMediaChangedListener(mongoDatabase, logger, mediaRepository)
  return new MediaDatabaseChangedService(mediaEventEmitter, mediaDataChangeListener)
}

function createDeviceDataChangeService(mongoDatabase: MongoDatabase, statusMessageService: StatusMessageService, deviceRepository: DeviceRepository, logger: Logger): DeviceChangedService {
  const sofieIngestMongoEntityConverter: SofieIngestMongoEntityConverter = new SofieIngestMongoEntityConverter()
  const deviceChangeListener: MongoDeviceChangedListener = new MongoDeviceChangedListener(mongoDatabase, sofieIngestMongoEntityConverter, logger)
  return new DeviceChangedService(statusMessageService, deviceRepository, deviceChangeListener, logger)
}

function createConfigurationDataChangeService(mongoDatabase: MongoDatabase, blueprint: Blueprint, statusMessageService: StatusMessageService, configurationRepository: ConfigurationRepository, logger: Logger): ConfigurationChangedService {
  const showStyleConfigurationDataChangeListener: MongoShowStyleChangedListener = new MongoShowStyleChangedListener(mongoDatabase, logger)
  const showStyleVariantConfigurationChangedListener: MongoShowStyleVariantConfigurationListener = new MongoShowStyleVariantConfigurationListener(mongoDatabase, logger)
  return new ConfigurationChangedService(blueprint, statusMessageService, configurationRepository, showStyleConfigurationDataChangeListener, showStyleVariantConfigurationChangedListener, logger)
}

const gitRevision: string = process.env.GIT_REVISION ?? ''

const consoleLogger: Logger = new ConsoleLogger()
  .tag('startup')
  .metadata({
    ...gitRevision ? { git_revision: gitRevision } : undefined,
  })
main(consoleLogger).catch(error => consoleLogger.data(error).error('Failed starting up Alba server.'))
