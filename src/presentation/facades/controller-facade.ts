import { RundownController } from '../controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../express-error-handler'
import { BaseController } from '../controllers/base-controller'
import { TimelineController } from '../controllers/timeline-controller'
import { ActionController } from '../controllers/action-controller'
import { ConfigurationController } from '../controllers/configuration-controller'
import { JsendResponseFormatter } from '../jsend-response-formatter'
import { ActionTriggerController } from '../controllers/action-trigger-controller'
import { LoggerFacade } from '../../logger/logger-facade'
import { MediaController } from '../controllers/media-controller'
import { SystemInformationController } from '../controllers/system-information-controller'

export class ControllerFacade {
  public static getControllers(): BaseController[] {
    return [
      this.createRundownController(),
      this.createTimelineController(),
      this.createActionController(),
      this.createActionTriggerController(),
      this.createConfigurationController(),
      this.createMediaController(),
      this.createSystemInformationController()
    ]
  }

  private static createRundownController(): RundownController {
    return new RundownController(
      ServiceFacade.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      ServiceFacade.createIngestService(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createExpressErrorHandler(): ExpressErrorHandler {
    return new ExpressErrorHandler(new JsendResponseFormatter(), LoggerFacade.createLogger())
  }

  private static createTimelineController(): TimelineController {
    return new TimelineController(
      RepositoryFacade.createTimelineRepository(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createActionController(): ActionController {
    return new ActionController(
      ServiceFacade.createActionService(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createActionTriggerController(): ActionTriggerController {
    return new ActionTriggerController(
      ServiceFacade.createActionTriggerService(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createConfigurationController(): ConfigurationController {
    return new ConfigurationController(
      ServiceFacade.createConfigurationService(),
      RepositoryFacade.createConfigurationRepository(),
      RepositoryFacade.createShowStyleVariantRepository(),
      RepositoryFacade.createShelfConfigurationRepository(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createMediaController(): MediaController {
    return new MediaController(
      RepositoryFacade.createMediaRepository(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createSystemInformationController(): SystemInformationController {
    return new SystemInformationController(
      RepositoryFacade.createSystemInformationRepository(),
      RepositoryFacade.createStatusMessageRepository(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }
}
