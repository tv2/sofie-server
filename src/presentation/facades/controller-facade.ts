import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../express-error-handler'
import { AdLibPieceController } from '../controllers/ad-lib-piece-controller'
import { BaseController } from '../controllers/base-controller'
import { TimelineController } from '../controllers/timeline-controller'
import { ConfigurationController } from '../controllers/configuration-controller'

export class ControllerFacade {
  public static getControllers(): BaseController[] {
    return [
      this.createRundownController(),
      this.createAdLibPieceController(),
      this.createTimelineController(),
      this.createConfigurationController()
    ]
  }

  private static createRundownController(): RundownController {
    return new RundownController(
      ServiceFacade.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      new ExpressErrorHandler()
    )
  }

  private static createAdLibPieceController(): AdLibPieceController {
    return new AdLibPieceController(
      ServiceFacade.createRundownService(),
      RepositoryFacade.createAdLibRepository(),
      new ExpressErrorHandler()
    )
  }

  private static createTimelineController(): TimelineController {
    return new TimelineController(RepositoryFacade.createTimelineRepository(), new ExpressErrorHandler())
  }

  private static createConfigurationController(): ConfigurationController {
    return new ConfigurationController(RepositoryFacade.createConfigurationRepository(), new ExpressErrorHandler())
  }
}
