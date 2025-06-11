import cors from 'cors'
import express, { Express, NextFunction, Request, Response, Router } from 'express'
import { BaseController } from './cross-cutting-concerns/application/controllers/base-controller'
import { ControllerFacade } from './presentation/facades/controller-facade'
import { EventServerFacade } from './presentation/facades/event-server-facade'
import { ServiceFacade } from './business-logic/facades/service-facade'
import { Logger } from './cross-cutting-concerns/application/interfaces/logger'
import { LoggerFacade } from './cross-cutting-concerns/application/logger-facade'
import { RepositoryFacade } from './data-access/facades/repository-facade'
import bodyParser from 'body-parser'

export * from './rundown-execution/application/controllers/rundown-controller'

const REST_API_PORT: number = 3005
const RUNDOWN_EVENT_SERVER_PORT: number = 3006

const controllers: BaseController[] = ControllerFacade.getControllers()

class AlbaServer {
  public server: Express

  constructor() {
    this.configureServer()
    this.configureRoutes()
    this.configureErrorHandling()
  }

  public configureServer(): void {
    this.server = express()
    this.server.use(bodyParser.json())
    this.server.use(cors())
  }

  public configureRoutes(): void {
    controllers.map(this.mapControllerToRouter).forEach((router) => this.addRouterToServer(router))
  }

  private configureErrorHandling(): void {
    this.server.use((err: object, _req: Request, res: Response, next: NextFunction): Response<Express> | void => {
      if ('status' in err && err.status === 400 && 'message' in err) {
        return res.status(err.status).json({error: err.message})
      }
      return next(err)
    })

    this.server.use((_req: Request, res: Response): Response => {
      return res.status(404).json({error: 'Not Found'})
    })

    this.server.use((err: object, _req: Request, res: Response, next: NextFunction): Response<Express> | void => {
      if ('status' in err && err.status === 500 && 'message' in err) {
        return res.status(500).json({error: 'Internal Server Error'})
      }
      return next(err)
    })
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

async function startAlbaServer(): Promise<void> {
  await connectToDatabase()
  await startSystemServices()
  attachExpressServerToPort(REST_API_PORT)
  startRundownEventServer()
}

function attachExpressServerToPort(port: number): void {
  new AlbaServer().server.listen(port, () => {
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
  await ServiceFacade.createPlayoutContentUpdateService().initialize()
  ServiceFacade.createIngestService()
  ServiceFacade.createMediaDataChangeService()
  ServiceFacade.createDeviceDataChangedService()
  ServiceFacade.createConfigurationDataChangedService()
}

startAlbaServer().catch((error) => LoggerFacade.createLogger().tag('startup').data(error).error('Unable to start Alba Server'))
