import { RundownController } from '../../rundown-execution/application/controllers/rundown-controller'
import { ServiceFacade } from '../../business-logic/facades/service-facade'
import { RepositoryFacade } from '../../data-access/facades/repository-facade'
import { ExpressErrorHandler } from '../../cross-cutting-concerns/application/services/express-error-handler'
import { BaseController } from '../../cross-cutting-concerns/application/controllers/base-controller'
import { TimelineController } from '../../rundown-execution/application/controllers/timeline-controller'
import { ActionController } from '../../action-system/application/controllers/action-controller'
import { ConfigurationController } from '../../rundown-execution/application/controllers/configuration-controller'
import { JsendResponseFormatter } from '../../cross-cutting-concerns/application/services/jsend-response-formatter'
import { TriggerController } from '../../action-system/application/controllers/trigger-controller'
import { LoggerFacade } from '../../cross-cutting-concerns/application/logger-facade'
import { MediaController } from '../../rundown-execution/application/controllers/media-controller'
import { SystemInformationController } from '../../cross-cutting-concerns/application/controllers/system-information-controller'
import { DeviceController } from '../../rundown-execution/application/controllers/device-controller'
import { LoggerController } from '../../cross-cutting-concerns/application/controllers/logger-controller'
import { MacroController } from '../../action-system/application/controllers/macro-controller'

export class ControllerFacade {
  public static getControllers(): BaseController[] {
    return [
      this.createRundownController(),
      this.createTimelineController(),
      this.createActionController(),
      this.createTriggerController(),
      this.createConfigurationController(),
      this.createMediaController(),
      this.createSystemInformationController(),
      this.createDeviceController(),
      this.createLoggerController(),
      this.createMacroController(),
    ]
  }

  private static createRundownController(): RundownController {
    return new RundownController(
      ServiceFacade.createRundownService(),
      RepositoryFacade.createRundownRepository(),
      ServiceFacade.createIngestService(),
      ServiceFacade.createPlayoutContentReadService(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter(),
      LoggerFacade.createLogger()
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

  private static createTriggerController(): TriggerController {
    return new TriggerController(
      ServiceFacade.createTriggerService(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter()
    )
  }

  private static createMacroController(): MacroController {
    return new MacroController(ServiceFacade.createMacroService(),
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

  private static createLoggerController(): LoggerController {
    return new LoggerController(
      new JsendResponseFormatter(),
      ControllerFacade.createExpressErrorHandler(),
      LoggerFacade.createLogger()
    )
  }

  private static createDeviceController(): DeviceController {
    return new DeviceController(
      RepositoryFacade.createVideoMixerDeviceRepository(),
      ControllerFacade.createExpressErrorHandler(),
      new JsendResponseFormatter(),
    )
  }
}
