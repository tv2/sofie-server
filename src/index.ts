import {BaseController} from './cross-cutting-concerns/application/controllers/base-controller'
import {ControllerFacade} from './leftovers/controller-facade'
import {EventServerFacade} from './cross-cutting-concerns/application/services/event-server-facade'
import {ServiceFacade} from './leftovers/service-facade'
import {Logger} from './cross-cutting-concerns/application/interfaces/logger'
import {LoggerFacade} from './cross-cutting-concerns/application/logger-facade'
import {RepositoryFacade} from './leftovers/repository-facade'
import {ExpressRestServer} from './cross-cutting-concerns/infrastructure/services/express-rest-server'

export * from './rundown-execution/application/controllers/rundown-controller'

const REST_API_PORT: number = 3005
const RUNDOWN_EVENT_SERVER_PORT: number = 3006


async function main(): Promise<void> {
  const logger: Logger = LoggerFacade.createLogger().tag('startup')
  await connectToDatabase(logger)
  await startSystemServices()
  await startRestServer(logger)
  await startEventServer()
  logger.info('Alba server is configured.')
}

async function connectToDatabase(logger: Logger): Promise<void> {
  await RepositoryFacade.getDatabase()
    .connect()
    .catch((reason) => logger.data(reason).error('Failed to connect to database'))
}

async function startSystemServices(): Promise<void> {
  await ServiceFacade.createIngestChangeService().initialize()
  await ServiceFacade.createPlayoutContentUpdateService().initialize()
  ServiceFacade.createIngestService()
  ServiceFacade.createMediaDataChangeService()
  ServiceFacade.createDeviceDataChangedService()
  ServiceFacade.createConfigurationDataChangedService()
}


async function startRestServer(logger: Logger): Promise<void> {
  const controllers: BaseController[] = ControllerFacade.getControllers()
  const restServer: ExpressRestServer = new ExpressRestServer(controllers, logger)
  await restServer.start(REST_API_PORT)
}

async function startEventServer(): Promise<void> {
  await EventServerFacade.createEventServer().startServer(RUNDOWN_EVENT_SERVER_PORT)
}

main().catch((error) => LoggerFacade.createLogger().tag('startup').data(error).error('Unable to start Alba Server.'))