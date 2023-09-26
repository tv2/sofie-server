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
import { ActionRepository } from '../repositories/interfaces/action-repository'
import { MongoActionRepository } from '../repositories/mongo/mongo-action-repository'

export class RepositoryFacade {
  public static createRundownRepository(): RundownRepository {
    const mongoRundownRepository: RundownRepository = new MongoRundownRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      this.createRundownBaselineRepository(),
      this.createSegmentRepository()
    )

    return CachedRundownRepository.getInstance(mongoRundownRepository)
  }

  public static createRundownBaselineRepository(): RundownBaselineRepository {
    return new MongoRundownBaselineRepository(MongoDatabase.getInstance(), new MongoEntityConverter())
  }

  public static createSegmentRepository(): SegmentRepository {
    return new MongoSegmentRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      this.createPartRepository()
    )
  }

  public static createPartRepository(): PartRepository {
    return new MongoPartRepository(
      MongoDatabase.getInstance(),
      new MongoEntityConverter(),
      this.createPieceRepository()
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
      this.createStudioRepository(),
      this.createShowStyleRepository()
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
}
