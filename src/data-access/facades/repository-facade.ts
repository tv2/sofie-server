import { RundownRepository } from '../repositories/interfaces/rundown-repository'
import { MongoRundownRepository } from '../repositories/mongo/mongo-rundown-repository'
import { MongoDatabase } from '../repositories/mongo/mongo-database'
import { MongoEntityConverter } from '../repositories/mongo/mongo-entity-converter'
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
import { MongoSegmentChangedListener } from '../repositories/mongo/mongo-segment-changed-listener'
import { MongoPartChangedListener } from '../repositories/mongo/mongo-part-changed-listener'
import { Segment } from '../../model/entities/segment'
import { Part } from '../../model/entities/part'
import { Rundown } from '../../model/entities/rundown'
import { MongoRundownChangedListener } from '../repositories/mongo/mongo-rundown-changed-listener'
import { ActionManifestRepository } from '../repositories/interfaces/action-manifest-repository'
import { MongoActionManifestRepository } from '../repositories/mongo/mongo-action-manifest-repository'
import { MediaRepository } from '../repositories/interfaces/MediaRepository'
import { MongoMediaRepository } from '../repositories/mongo/mongo-media-repository'

export class RepositoryFacade {
  public static createRundownRepository(): RundownRepository {
    const mongoRundownRepository: RundownRepository = new MongoRundownRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createRundownBaselineRepository(),
      RepositoryFacade.createSegmentRepository(),
      RepositoryFacade.createPieceRepository()
    )
    return CachedRundownRepository.getInstance(mongoRundownRepository)
  }

  public static createRundownBaselineRepository(): RundownBaselineRepository {
    return new MongoRundownBaselineRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createRundownChangeListener(): DataChangedListener<Rundown> {
    return new MongoRundownChangedListener(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createRundownRepository()
    )
  }

  public static createSegmentRepository(): SegmentRepository {
    return new MongoSegmentRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createPartRepository()
    )
  }

  public static createSegmentChangedListener(): DataChangedListener<Segment> {
    return new MongoSegmentChangedListener(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createSegmentRepository()
    )
  }

  public static createPartRepository(): PartRepository {
    return new MongoPartRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createPieceRepository()
    )
  }

  public static createPartChangedListener(): DataChangedListener<Part> {
    return new MongoPartChangedListener(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      RepositoryFacade.createPartRepository()
    )
  }

  public static createPieceRepository(): PieceRepository {
    return new MongoPieceRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createTimelineRepository(): TimelineRepository {
    return new MongoTimelineRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createConfigurationRepository(): ConfigurationRepository {
    const configurationRepository: ConfigurationRepository = new MongoConfigurationRepository(
      RepositoryFacade.createStudioRepository(),
      RepositoryFacade.createShowStyleRepository()
    )
    return CachedConfigurationRepository.getInstance(configurationRepository)
  }

  private static createStudioRepository(): StudioRepository {
    return new MongoStudioRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  private static createShowStyleRepository(): ShowStyleRepository {
    return new MongoShowStyleRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createActionRepository(): ActionRepository {
    return new MongoActionRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createShowStyleVariantRepository(): ShowStyleVariantRepository {
    return new MongoShowStyleVariantRepository(MongoDatabase.getInstance(), new MongoEntityConverter(), this.createRundownRepository())
  }

  public static createActionManifestRepository(): ActionManifestRepository {
    return new MongoActionManifestRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createMediaRepository(): MediaRepository {
    return new MongoMediaRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }
}
