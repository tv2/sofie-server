import { RundownRepository } from '../repositories/interfaces/rundown-repository'
import { MongoRundownAggregateRepository } from '../repositories/mongo/mongo-rundown-aggregate-repository'
import { MongoDatabase } from '../repositories/mongo/mongo-database'
import { MongoIngestedEntityConverter } from '../repositories/mongo/mongo-ingested-entity-converter'
import { SegmentRepository } from '../repositories/interfaces/segment-repository'
import { MongoSegmentRepository } from '../repositories/mongo/mongo-segment-repository'
import { PartRepository } from '../repositories/interfaces/part-repository'
import { MongoPieceRepository } from '../repositories/mongo/mongo-piece-repository'
import { MongoPartRepository } from '../repositories/mongo/mongo-part-repository'
import { TimelineRepository } from '../repositories/interfaces/timeline-repository'
import { MongoTimelineRepository } from '../repositories/mongo/mongo-timeline-repository'
import { CachedRundownAggregateRepository } from '../repositories/cache/cached-rundown-aggregate-repository'
import { RundownBaselineRepository } from '../repositories/interfaces/rundown-baseline-repository'
import { MongoRundownBaselineRepository } from '../repositories/mongo/mongo-rundown-baseline-repository'
import { StudioRepository } from '../repositories/interfaces/studio-repository'
import { MongoStudioRepository } from '../repositories/mongo/mongo-studio-repository'
import { ShowStyleRepository } from '../repositories/interfaces/show-style-repository'
import { CachedConfigurationRepository } from '../repositories/cache/cached-configuration-repository'
import { MongoShowStyleRepository } from '../repositories/mongo/mongo-show-style-repository'
import { ConfigurationRepository } from '../repositories/interfaces/configuration-repository'
import { MongoConfigurationRepository } from '../repositories/mongo/mongo-configuration-repository'
import { ShowStyleVariantRepository } from '../repositories/interfaces/show-style-variant-repository'
import { MongoShowStyleVariantRepository } from '../repositories/mongo/mongo-show-style-variant-repository'
import { ActionRepository } from '../repositories/interfaces/action-repository'
import { MongoActionRepository } from '../repositories/mongo/mongo-action-repository'
import { DataChangedListener } from '../repositories/interfaces/data-changed-listener'
import { MongoIngestedSegmentChangedListener } from '../repositories/mongo/mongo-ingested-segment-changed-listener'
import { MongoIngestedPartChangedListener } from '../repositories/mongo/mongo-ingested-part-changed-listener'
import { MongoIngestedRundownChangedListener } from '../repositories/mongo/mongo-ingested-rundown-changed-listener'
import { ActionManifestRepository } from '../repositories/interfaces/action-manifest-repository'
import { MongoAdLibActionsRepository } from '../repositories/mongo/mongo-ad-lib-actions-repository'
import { MediaRepository } from '../repositories/interfaces/media-repository'
import { MongoMediaRepository } from '../repositories/mongo/mongo-media-repository'
import { MongoAdLibPieceRepository } from '../repositories/mongo/mongo-ad-lib-piece-repository'
import { MongoActionManifestRepository } from '../repositories/mongo/mongo-action-manifest-repository'
import { IngestedRundownRepository } from '../repositories/interfaces/ingested-rundown-repository'
import { IngestedPieceRepository } from '../repositories/interfaces/ingested-piece-repository'
import { MongoIngestedPieceRepository } from '../repositories/mongo/mongo-ingested-piece-repository'
import { IngestedPartRepository } from '../repositories/interfaces/ingested-part-repository'
import { MongoIngestedPartRepository } from '../repositories/mongo/mongo-ingested-part-repository'
import { IngestedSegmentRepository } from '../repositories/interfaces/ingested-segment-repository'
import { MongoIngestedSegmentRepository } from '../repositories/mongo/mongo-ingested-segment-repository'
import { MongoIngestedRundownRepository } from '../repositories/mongo/mongo-ingested-rundown-repository'
import { MongoEntityConverter } from '../repositories/mongo/mongo-entity-converter'
import { IngestedRundown } from '../../model/entities/ingested-rundown'
import { IngestedPart } from '../../model/entities/ingested-part'
import { IngestedSegment } from '../../model/entities/ingested-segment'
import { TriggerRepository } from '../repositories/interfaces/trigger-repository'
import { MongoTriggerRepository } from '../repositories/mongo/mongo-trigger-repository'
import { CryptoUuidGenerator } from '../repositories/crypto-uuid-generator'
import { UuidGenerator } from '../repositories/interfaces/uuid-generator'
import { LoggerFacade } from '../../logger/logger-facade'
import { MongoMediaChangedListener } from '../repositories/mongo/mongo-media-changed-listener'
import { Media } from '../../model/entities/media'
import { SystemInformationRepository } from '../repositories/interfaces/system-information-repository'
import { MongoSystemInformationRepository } from '../repositories/mongo/mongo-system-information-repository'
import { ShelfConfigurationRepository } from '../repositories/interfaces/shelf-configuration-repository'
import { MongoShelfRepository } from '../repositories/mongo/mongo-shelf-repository'
import { MongoDeviceChangedListener } from '../repositories/mongo/mongo-device-changed-listener'
import { StatusMessageRepository } from '../repositories/interfaces/status-message-repository'
import { MongoStatusMessageRepository } from '../repositories/mongo/mongo-status-message-repository'
import { MongoCoreDeviceConfigurationRepository } from '../repositories/mongo/mongo-core-device-configuration-repository'
import { ShowStyle } from '../../model/entities/show-style'
import { MongoShowStyleChangedListener } from '../repositories/mongo/mongo-show-style-changed-listener'
import { Database } from '../repositories/interfaces/database'
import { ShowStyleVariant } from '../../model/entities/show-style-variant'
import {
  MongoShowStyleVariantConfigurationListener
} from '../repositories/mongo/mongo-show-style-variant-configuration-listener'
import { RundownAggregateRepository } from '../repositories/interfaces/rundown-aggregate-repository'
import { IngestedPiece } from '../../model/entities/ingested-piece'
import { PieceRepository } from '../repositories/interfaces/piece-repository'
import { MongoIngestedPieceChangedListener } from '../repositories/mongo/mongo-ingested-piece-changed-listener'
import { MongoDeviceConfigurationRepository } from '../repositories/mongo/mongo-device-configuration-repository'
import { DeviceConfigurationRepository } from '../repositories/interfaces/device-configuration-repository'
import { CoreDeviceConfiguration } from '../../model/entities/device-configuration'
import { VideoMixerDeviceRepository } from '../repositories/interfaces/video-mixer-device-repository'
import { MongoVideoMixerDeviceRepository } from '../repositories/mongo/mongo-video-mixer-device-repository'
import { EventEmitterFacade } from '../../presentation/facades/event-emitter-facade'
import { MongoExpectedPlayoutItemRepository } from '../repositories/mongo/mongo-expected-playout-item-repository'
import { MongoMacroRepository } from '../repositories/mongo/mongo-macro-repository'
import { MacroRepository } from '../repositories/interfaces/macro-repository'
import { PlayoutContentRepository } from '../repositories/interfaces/playout-content-repository'
import { MongoPlayoutContentRepository } from '../repositories/mongo/mongo-playout-content-repository'

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

  public static createDeviceConfigurationDataChangedListener(): DataChangedListener<CoreDeviceConfiguration> {
    return new MongoDeviceChangedListener(
      MongoDatabase.getInstance(LoggerFacade.createLogger()),
      new MongoEntityConverter(LoggerFacade.createLogger()),
      LoggerFacade.createLogger()
    )
  }

  public static createCoreConfigurationDeviceRepository(): DeviceConfigurationRepository {
    return new MongoCoreDeviceConfigurationRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()), new MongoEntityConverter(LoggerFacade.createLogger()))
  }

  public static createStatusMessageRepository(): StatusMessageRepository {
    return new MongoStatusMessageRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()))
  }

  public static createDeviceConfigurationRepository(): DeviceConfigurationRepository {
    return new MongoDeviceConfigurationRepository(MongoDatabase.getInstance(LoggerFacade.createLogger()),
      this.createUuidGenerator() )
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
