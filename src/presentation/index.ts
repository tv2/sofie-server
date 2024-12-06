import cors from 'cors'
import express, { Express, Router } from 'express'
import { BaseController } from './controllers/base-controller'
import { ControllerFacade } from './facades/controller-facade'
import { EventServerFacade } from './facades/event-server-facade'
import { ServiceFacade } from '../business-logic/facades/service-facade'
import { Logger } from '../logger/logger'
import { LoggerFacade } from '../logger/logger-facade'
import { RepositoryFacade } from '../data-access/facades/repository-facade'

export * from './controllers/rundown-controller'

const REST_API_PORT: number = 3005
const RUNDOWN_EVENT_SERVER_PORT: number = 3006

const controllers: BaseController[] = ControllerFacade.getControllers()

class SofieServer {
  public server: Express

  constructor() {
    this.configureServer()
    this.configureRoutes()
  }

  public configureServer(): void {
    this.server = express()
    this.server.use(express.json())
    this.server.use(cors())
  }

  public configureRoutes(): void {
    controllers.map(this.mapControllerToRouter).forEach((router) => this.addRouterToServer(router))
  }

  public mapControllerToRouter(controller: BaseController): Router {
    const router: Router = Router()
    controller.getRoutes().forEach((route) => router[route.method](route.path, route.action.bind(controller)))
    return router
  }

  public addRouterToServer(router: Router): void {
    this.server.use('/api', router)
  }
}

async function startSofieServer(): Promise<void> {
  await connectToDatabase()
  await startSystemServices()
  attachExpressServerToPort(REST_API_PORT)
  startRundownEventServer()
}

function attachExpressServerToPort(port: number): void {
  new SofieServer().server.listen(port, () => {
    const logger: Logger = LoggerFacade.createLogger().tag('startup')
    return logger.info(`Express is listening at http://localhost:${port}`)
  })
}

function startRundownEventServer(): void {
  EventServerFacade.createEventServer().startServer(RUNDOWN_EVENT_SERVER_PORT)
}

async function connectToDatabase(): Promise<void> {
  const logger: Logger = LoggerFacade.createLogger().tag('startup')
  await RepositoryFacade.getDatabase()
    .connect()
    .catch((reason) => logger.data(reason).error('Failed to connect to database'))
}

async function startSystemServices(): Promise<void> {
  await ServiceFacade.createIngestChangeService().initialize()
  ServiceFacade.createIngestService()
  ServiceFacade.createMediaDataChangeService()
  ServiceFacade.createDeviceDataChangedService()
  ServiceFacade.createConfigurationDataChangedService()
}

startSofieServer().catch((error) => LoggerFacade.createLogger().tag('startup').data(error).error('Unable to start Sofie Server'))
