import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../express-error-handler'
import { BaseController } from '../controllers/base-controller'
import { TimelineController } from '../controllers/timeline-controller'
import { ActionController } from '../controllers/action-controller'
import { ConfigurationController } from '../controllers/configuration-controller'
import { ActionTriggerController } from '../controllers/action-trigger-controller'

export class ControllerFacade {
  public static getControllers(): BaseController[] {
    return [
      this.createRundownController(),
      this.createTimelineController(),
      this.createActionController(),
      this.createActionTriggerController(),
      this.createConfigurationController(),
    ]
  }

  private static createRundownController(): RundownController {
    return new RundownController(
      ServiceFacade.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      ServiceFacade.createIngestService(),
      new ExpressErrorHandler()
    )
  }

  private static createTimelineController(): TimelineController {
    return new TimelineController(RepositoryFacade.createTimelineRepository(), new ExpressErrorHandler())
  }

  private static createActionController(): ActionController {
    return new ActionController(ServiceFacade.createActionService(), new ExpressErrorHandler())
  }

  private static createActionTriggerController(): ActionTriggerController {
    return new ActionTriggerController(
      ServiceFacade.createActionTriggerService(),
      new ExpressErrorHandler()
    )
  }

  private static createConfigurationController(): ConfigurationController {
    return new ConfigurationController(
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createShowStyleVariantRepository(),
      new ExpressErrorHandler()
    )
  }
}
