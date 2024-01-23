import { RundownRepository } from '../repositories/interfaces/rundown-repository'
import { MongoRundownRepository } from '../repositories/mongo/mongo-rundown-repository'
import { MongoDatabase } from '../repositories/mongo/mongo-database'
import { MongoIngestedEntityConverter } from '../repositories/mongo/mongo-ingested-entity-converter'
import { SegmentRepository } from '../repositories/interfaces/segment-repository'
import { MongoSegmentRepository } from '../repositories/mongo/mongo-segment-repository'
import { PartRepository } from '../repositories/interfaces/part-repository'
import { PieceRepository } from '../repositories/interfaces/piece-repository'
import { MongoPieceRepository } from '../repositories/mongo/mongo-piece-repository'
import { MongoPartRepository } from '../repositories/mongo/mongo-part-repository'
import { TimelineRepository } from '../repositories/interfaces/timeline-repository'
import { MongoTimelineRepository } from '../repositories/mongo/mongo-timeline-repository'
import { CachedRundownRepository } from '../repositories/cache/cached-rundown-repository'
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
import { MediaRepository } from '../repositories/interfaces/MediaRepository'
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
import { CachedSegmentRepository } from '../repositories/cache/cached-segment-repository'
import { CachedPartRepository } from '../repositories/cache/cached-part-repository'
import { ActionTriggerRepository } from '../repositories/interfaces/action-trigger-repository'
import { MongoActionTriggerRepository } from '../repositories/mongo/mongo-action-trigger-repository'
import { CryptoUuidGenerator } from '../repositories/crypto-uuid-generator'
import { UuidGenerator } from '../repositories/interfaces/uuid-generator'
import { LoggerFacade } from '../../logger/logger-facade'
import { MongoMediaChangedListener } from '../repositories/mongo/mongo-media-changed-listener'
import { Media } from '../../model/entities/media'

export class RepositoryFacade {
  public static createRundownRepository(): RundownRepository {
    const mongoRundownRepository: RundownRepository = new MongoRundownRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPieceRepository()
    )
    return CachedRundownRepository.getInstance(mongoRundownRepository, LoggerFacade.createLogger())
  }

  private static getMongoDatabaseInstance(): MongoDatabase {
    return MongoDatabase.getInstance(LoggerFacade.createLogger())
  }

  public static createIngestedRundownRepository(): IngestedRundownRepository {
    return new MongoIngestedRundownRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createRundownBaselineRepository(),
      RepositoryFacade.createIngestedSegmentRepository()
    )
  }

  public static createIngestedRundownChangeListener(): DataChangedListener<IngestedRundown> {
    return new MongoIngestedRundownChangedListener(
      RepositoryFacade.getMongoDatabaseInstance(),
      RepositoryFacade.createIngestedRundownRepository(),
      LoggerFacade.createLogger()
    )
  }

  public static createRundownBaselineRepository(): RundownBaselineRepository {
    return new MongoRundownBaselineRepository(RepositoryFacade.getMongoDatabaseInstance())
  }

  public static createSegmentRepository(): SegmentRepository {
    const mongoSegmentRepository: SegmentRepository = new MongoSegmentRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createPartRepository()
    )
    return CachedSegmentRepository.getInstance(mongoSegmentRepository)
  }

  public static createIngestedSegmentRepository(): IngestedSegmentRepository {
    return new MongoIngestedSegmentRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createIngestedPartRepository()
    )
  }

  public static createIngestedSegmentChangedListener(): DataChangedListener<IngestedSegment> {
    return new MongoIngestedSegmentChangedListener(
      RepositoryFacade.getMongoDatabaseInstance(),
      RepositoryFacade.createIngestedSegmentRepository(),
      LoggerFacade.createLogger()
    )
  }

  public static createPartRepository(): PartRepository {
    const mongoPartRepository: PartRepository = new MongoPartRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createPieceRepository()
    )
    return CachedPartRepository.getInstance(mongoPartRepository)
  }

  public static createIngestedPartRepository(): IngestedPartRepository {
    return new MongoIngestedPartRepository(
      RepositoryFacade.getMongoDatabaseInstance(),
      new MongoIngestedEntityConverter(),
      RepositoryFacade.createIngestedPieceRepository()
    )
  }

  public static createIngestedPartChangedListener(): DataChangedListener<IngestedPart> {
    return new MongoIngestedPartChangedListener(
      RepositoryFacade.getMongoDatabaseInstance(),
      RepositoryFacade.createIngestedPartRepository(),
      LoggerFacade.createLogger()
    )
  }

  public static createMediaChangedListener(): DataChangedListener<Media> {
    return new MongoMediaChangedListener(
      RepositoryFacade.getMongoDatabaseInstance(),
      LoggerFacade.createLogger(),
      RepositoryFacade.createMediaRepository()
    )
  }

  public static createPieceRepository(): PieceRepository {
    return new MongoPieceRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter())
  }

  public static createIngestedPieceRepository(): IngestedPieceRepository {
    return new MongoIngestedPieceRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoIngestedEntityConverter())
  }

  public static createTimelineRepository(): TimelineRepository {
    return new MongoTimelineRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter())
  }

  public static createConfigurationRepository(): ConfigurationRepository {
    const configurationRepository: ConfigurationRepository = new MongoConfigurationRepository(
      RepositoryFacade.createStudioRepository(),
      RepositoryFacade.createShowStyleRepository()
    )
    return CachedConfigurationRepository.getInstance(configurationRepository)
  }

  private static createStudioRepository(): StudioRepository {
    return new MongoStudioRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter())
  }

  private static createShowStyleRepository(): ShowStyleRepository {
    return new MongoShowStyleRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter())
  }

  public static createActionRepository(): ActionRepository {
    return new MongoActionRepository(RepositoryFacade.getMongoDatabaseInstance())
  }

  public static createActionTriggerRepository(): ActionTriggerRepository {
    return new MongoActionTriggerRepository(RepositoryFacade.getMongoDatabaseInstance(), this.createUuidGenerator())
  }

  public static createShowStyleVariantRepository(): ShowStyleVariantRepository {
    return new MongoShowStyleVariantRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter(), this.createRundownRepository())
  }

  public static createActionManifestRepository(): ActionManifestRepository {
    return new MongoActionManifestRepository([this.createAdLibActionRepository(), this.createAdLibPieceRepository()])
  }

  private static createAdLibActionRepository(): ActionManifestRepository {
    return new MongoAdLibActionsRepository(RepositoryFacade.getMongoDatabaseInstance())
  }

  private static createAdLibPieceRepository(): ActionManifestRepository {
    return new MongoAdLibPieceRepository(RepositoryFacade.getMongoDatabaseInstance())
  }

  public static createMediaRepository(): MediaRepository {
    return new MongoMediaRepository(RepositoryFacade.getMongoDatabaseInstance(), new MongoEntityConverter())
  }

  private static createUuidGenerator(): UuidGenerator {
    return new CryptoUuidGenerator()
  }
}
