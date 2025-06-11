import { RundownRepository } from '../../rundown-execution/domain/repositories/rundown-repository'
import { MongoRundownAggregateRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-rundown-aggregate-repository'
import { MongoDatabase } from '../../cross-cutting-concerns/infrastructure/mongodb/mongo-database'
import { MongoIngestedEntityConverter } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-entity-converter'
import { SegmentRepository } from '../../rundown-execution/domain/repositories/segment-repository'
import { MongoSegmentRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-segment-repository'
import { PartRepository } from '../../rundown-execution/domain/repositories/part-repository'
import { MongoPieceRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-piece-repository'
import { MongoPartRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-part-repository'
import { TimelineRepository } from '../../rundown-execution/domain/repositories/timeline-repository'
import { MongoTimelineRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-timeline-repository'
import { CachedRundownAggregateRepository } from '../../rundown-execution/infrastructure/repositories/cache/cached-rundown-aggregate-repository'
import { RundownBaselineRepository } from '../../rundown-execution/domain/repositories/rundown-baseline-repository'
import { MongoRundownBaselineRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-rundown-baseline-repository'
import { StudioRepository } from '../../rundown-execution/domain/repositories/studio-repository'
import { MongoStudioRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-studio-repository'
import { ShowStyleRepository } from '../../rundown-execution/domain/repositories/show-style-repository'
import { CachedConfigurationRepository } from '../../rundown-execution/infrastructure/repositories/cache/cached-configuration-repository'
import { MongoShowStyleRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-repository'
import { ConfigurationRepository } from '../../rundown-execution/domain/repositories/configuration-repository'
import { MongoConfigurationRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-configuration-repository'
import { ShowStyleVariantRepository } from '../../rundown-execution/domain/repositories/show-style-variant-repository'
import { MongoShowStyleVariantRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-variant-repository'
import { ActionRepository } from '../../action-system/domain/repositories/action-repository'
import { MongoActionRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-action-repository'
import { DataChangedListener } from '../../cross-cutting-concerns/application/interfaces/data-changed-listener'
import { MongoIngestedSegmentChangedListener } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-segment-changed-listener'
import { MongoIngestedPartChangedListener } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-part-changed-listener'
import { MongoIngestedRundownChangedListener } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-rundown-changed-listener'
import { ActionManifestRepository } from '../../action-system/domain/repositories/action-manifest-repository'
import { MongoAdLibActionsRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-ad-lib-actions-repository'
import { MediaRepository } from '../../rundown-execution/domain/repositories/media-repository'
import { MongoMediaRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-media-repository'
import { MongoAdLibPieceRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-ad-lib-piece-repository'
import { MongoActionManifestRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-action-manifest-repository'
import { IngestedRundownRepository } from '../../sofie-ingest/domain/repositories/ingested-rundown-repository'
import { IngestedPieceRepository } from '../../sofie-ingest/domain/repositories/ingested-piece-repository'
import { MongoIngestedPieceRepository } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-piece-repository'
import { IngestedPartRepository } from '../../sofie-ingest/domain/repositories/ingested-part-repository'
import { MongoIngestedPartRepository } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-part-repository'
import { IngestedSegmentRepository } from '../../sofie-ingest/domain/repositories/ingested-segment-repository'
import { MongoIngestedSegmentRepository } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-segment-repository'
import { MongoIngestedRundownRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-ingested-rundown-repository'
import { MongoEntityConverter } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-entity-converter'
import { IngestedRundown } from '../../rundown-execution/domain/entities/ingested-rundown'
import { IngestedPart } from '../../rundown-execution/domain/entities/ingested-part'
import { IngestedSegment } from '../../rundown-execution/domain/entities/ingested-segment'
import { TriggerRepository } from '../../action-system/domain/repositories/trigger-repository'
import { MongoTriggerRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-trigger-repository'
import { CryptoUuidGenerator } from '../../cross-cutting-concerns/infrastructure/crypto-uuid-generator'
import { UuidGenerator } from '../../cross-cutting-concerns/infrastructure/interfaces/uuid-generator'
import { LoggerFacade } from '../../cross-cutting-concerns/application/logger-facade'
import { MongoMediaChangedListener } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-media-changed-listener'
import { Media } from '../../rundown-execution/domain/entities/media'
import { SystemInformationRepository } from '../../rundown-execution/domain/repositories/system-information-repository'
import { MongoSystemInformationRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-system-information-repository'
import { ShelfConfigurationRepository } from '../../rundown-execution/domain/repositories/shelf-configuration-repository'
import { MongoShelfRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-shelf-repository'
import { MongoDeviceChangedListener } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-device-changed-listener'
import { StatusMessageRepository } from '../../rundown-execution/domain/repositories/status-message-repository'
import { MongoStatusMessageRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-status-message-repository'
import { MongoCoreDeviceRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-core-device-repository'
import { ShowStyle } from '../../rundown-execution/domain/entities/show-style'
import { MongoShowStyleChangedListener } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-changed-listener'
import { Database } from '../../cross-cutting-concerns/infrastructure/interfaces/database'
import { ShowStyleVariant } from '../../rundown-execution/domain/entities/show-style-variant'
import {
  MongoShowStyleVariantConfigurationListener
} from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-show-style-variant-configuration-listener'
import { RundownAggregateRepository } from '../../rundown-execution/domain/repositories/rundown-aggregate-repository'
import { IngestedPiece } from '../../rundown-execution/domain/entities/ingested-piece'
import { PieceRepository } from '../../rundown-execution/domain/repositories/piece-repository'
import { MongoIngestedPieceChangedListener } from '../../sofie-ingest/infrastructure/repositories/mongodb/mongo-ingested-piece-changed-listener'
import { DeviceRepository } from '../../rundown-execution/domain/repositories/device-repository'
import { VideoMixerDeviceRepository } from '../../rundown-execution/domain/repositories/video-mixer-device-repository'
import { MongoVideoMixerDeviceRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-video-mixer-device-repository'
import { EventEmitterFacade } from '../../presentation/facades/event-emitter-facade'
import { MongoExpectedPlayoutItemRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-expected-playout-item-repository'
import { MongoMacroRepository } from '../../action-system/infrastructure/repositories/mongodb/mongo-macro-repository'
import { MacroRepository } from '../../action-system/domain/repositories/macro-repository'
import { PlayoutContentRepository } from '../../rundown-execution/domain/repositories/playout-content-repository'
import { MongoPlayoutContentRepository } from '../../rundown-execution/infrastructure/repositories/mongodb/mongo-playout-content-repository'
import { CoreDevice } from '../../rundown-execution/domain/entities/device'

export class RepositoryFacade {
  public static getDatabase(): Database {
    return MongoDatabase.getInstance(LoggerFacade.createLogger())
  }

  public static createRundownRepository(): RundownRepository {
    return this.createRundownAggregateRepository()
  }

  private static createRundownAggregateRepository(): RundownAggregateRepository {
    const mongoRundownRepository: RundownAggregateRepository = new MongoRundownAggregateRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      RepositoryFacade.createMongoSegmentRepository(),
      RepositoryFacade.createMongoPartRepository(),
      RepositoryFacade.createMongoPieceRepository(),
      RepositoryFacade.createExpectedPlayoutItemRepository(),
      new MongoEntityConverter(LoggerFacade.createLogger()),
    )
    return CachedRundownAggregateRepository.getInstance(mongoRundownRepository, LoggerFacade.createLogger())
  }

  public static createIngestedRundownRepository(): IngestedRundownRepository {
    return new MongoIngestedRundownRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createRundownBaselineRepository(),
      RepositoryFacade.createIngestedSegmentRepository(),
      RepositoryFacade.createIngestedPartRepository(),
      RepositoryFacade.createIngestedPieceRepository(),
    )
  }

  public static createIngestedRundownChangeListener(): DataChangedListener<IngestedRundown> {
    return new MongoIngestedRundownChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      LoggerFacade.createLogger()
    )
  }

  public static createRundownBaselineRepository(): RundownBaselineRepository {
    return new MongoRundownBaselineRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  public static createSegmentRepository(): SegmentRepository {
    return this.createRundownAggregateRepository()
  }

  private static createMongoSegmentRepository(): MongoSegmentRepository {
    return new MongoSegmentRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      RepositoryFacade.createMongoPartRepository(),
      new MongoEntityConverter(LoggerFacade.createLogger()),
    )
  }

  public static createIngestedSegmentRepository(): IngestedSegmentRepository {
    return new MongoIngestedSegmentRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createIngestedPartRepository()
    )
  }

  public static createIngestedSegmentChangedListener(): DataChangedListener<IngestedSegment> {
    return new MongoIngestedSegmentChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      LoggerFacade.createLogger()
    )
  }

  public static createPartRepository(): PartRepository {
    return this.createRundownAggregateRepository()
  }

  public static createPieceRepository(): PieceRepository {
    return this.createRundownAggregateRepository()
  }

  private static createMongoPartRepository(): MongoPartRepository {
    return new MongoPartRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      RepositoryFacade.createMongoPieceRepository(),
      new MongoEntityConverter(LoggerFacade.createLogger()),
    )
  }

  public static createIngestedPartRepository(): IngestedPartRepository {
    return new MongoIngestedPartRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createIngestedPieceRepository()
    )
  }

  public static createIngestedPartChangedListener(): DataChangedListener<IngestedPart> {
    return new MongoIngestedPartChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      LoggerFacade.createLogger()
    )
  }

  public static createIngestedPieceChangedListener(): DataChangedListener<IngestedPiece> {
    return new MongoIngestedPieceChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoIngestedEntityConverter(),
      LoggerFacade.createLogger()
    )
  }

  public static createMediaChangedListener(): DataChangedListener<Media> {
    return new MongoMediaChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      LoggerFacade.createLogger(),
      RepositoryFacade.createMediaRepository()
    )
  }

  private static createMongoPieceRepository(): MongoPieceRepository {
    return new MongoPieceRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createIngestedPieceRepository(): IngestedPieceRepository {
    return new MongoIngestedPieceRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoIngestedEntityConverter())
  }

  public static createTimelineRepository(): TimelineRepository {
    return new MongoTimelineRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createConfigurationRepository(): ConfigurationRepository {
    const configurationRepository: ConfigurationRepository = new MongoConfigurationRepository(
      RepositoryFacade.createStudioRepository(),
      RepositoryFacade.createShowStyleRepository()
    )
    return CachedConfigurationRepository.getInstance(configurationRepository)
  }

  private static createStudioRepository(): StudioRepository {
    return new MongoStudioRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  private static createShowStyleRepository(): ShowStyleRepository {
    return new MongoShowStyleRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      RepositoryFacade.createShowStyleVariantRepository(),
      new MongoEntityConverter(LoggerFacade.createLogger())
    )
  }

  public static createShowStyleChangedListener(): DataChangedListener<ShowStyle> {
    return new MongoShowStyleChangedListener(MongoDatabase.getInstance(LoggerFacade.createLogger()), LoggerFacade.createLogger())
  }

  public static createShowStyleVariantConfigurationListener(): DataChangedListener<ShowStyleVariant> {
    return new MongoShowStyleVariantConfigurationListener(MongoDatabase.getInstance(LoggerFacade.createLogger()), LoggerFacade.createLogger())
  }

  public static createShelfConfigurationRepository(): ShelfConfigurationRepository {
    return new MongoShelfRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), this.createUuidGenerator())
  }

  public static createActionRepository(): ActionRepository {
    return new MongoActionRepository(new MongoEntityConverter(LoggerFacade.createLogger()), MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  public static createMacroRepository(): MacroRepository {
    return new MongoMacroRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), this.createUuidGenerator())
  }

  public static createTriggerRepository(): TriggerRepository {
    return new MongoTriggerRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), this.createUuidGenerator())
  }

  public static createShowStyleVariantRepository(): ShowStyleVariantRepository {
    return new MongoShowStyleVariantRepository(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoEntityConverter(LoggerFacade.createLogger()),
      this.createRundownRepository()
    )
  }

  public static createActionManifestRepository(): ActionManifestRepository {
    return new MongoActionManifestRepository([this.createAdLibActionRepository(), this.createAdLibPieceRepository()])
  }

  private static createAdLibActionRepository(): ActionManifestRepository {
    return new MongoAdLibActionsRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  private static createAdLibPieceRepository(): ActionManifestRepository {
    return new MongoAdLibPieceRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  public static createMediaRepository(): MediaRepository {
    return new MongoMediaRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createSystemInformationRepository(): SystemInformationRepository {
    return new MongoSystemInformationRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createDeviceDataChangedListener(): DataChangedListener<CoreDevice> {
    return new MongoDeviceChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoEntityConverter(LoggerFacade.createLogger()),
      LoggerFacade.createLogger()
    )
  }

  public static createCoreDeviceRepository(): DeviceRepository {
    return new MongoCoreDeviceRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createStatusMessageRepository(): StatusMessageRepository {
    return new MongoStatusMessageRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  private static createUuidGenerator(): UuidGenerator {
    return new CryptoUuidGenerator()
  }

  private static createExpectedPlayoutItemRepository(): MongoExpectedPlayoutItemRepository {
    return new MongoExpectedPlayoutItemRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  public static createVideoMixerDeviceRepository(): VideoMixerDeviceRepository {
    return new MongoVideoMixerDeviceRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), EventEmitterFacade.createDeviceEventEmitter())
  }

  public static createPlayoutContentRepository(): PlayoutContentRepository {
    return new MongoPlayoutContentRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }
}
