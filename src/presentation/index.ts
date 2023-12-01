import cors from 'cors'
import express, { Express, Router } from 'express'
import { BaseController } from './controllers/base-controller'
import { ControllerFacade } from './facades/controller-facade'
import { RundownEventServerFacade } from './facades/rundown-event-server-facade'
import { ServiceFacade } from '../business-logic/facades/service-facade'
import { Logger } from '../logger'

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
    const router = Router()
    controller.getRoutes().forEach((route) => router[route.method](route.path, route.action.bind(controller)))
    return router
  }

  public addRouterToServer(router: Router): void {
    this.server.use('/api', router)
  }
}

function startSofieServer(): void {
  attachExpressServerToPort(REST_API_PORT)
  startRundownEventServer()
  startSystemServices()
}

function attachExpressServerToPort(port: number): void {
  new SofieServer().server.listen(port, () => {
    const logger: Logger = Logger.getInstance()
    logger.tag('presentation-index')
    return logger.info(`Express is listening at http://localhost:${port}`)
  })
}

function startRundownEventServer(): void {
  RundownEventServerFacade.createRundownEventServer().startServer(RUNDOWN_EVENT_SERVER_PORT)
}

function startSystemServices(): void {
  ServiceFacade.createIngestChangeService()
  ServiceFacade.createIngestService()
}

startSofieServer()
