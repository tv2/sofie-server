import express, { Express, NextFunction, Request, Response, Router } from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { BaseController } from '../../application/controllers/base-controller'
import { Logger } from '../../application/interfaces/logger'

export class ExpressRestServer {
  private readonly server: Express
  private readonly logger: Logger

  constructor(
    private readonly controllers: readonly BaseController[],
    logger: Logger
  ) {
    this.logger = logger.tag(this.constructor.name)
    this.server = this.configureServer()
    this.configureRoutes()
    this.configureErrorHandling()
  }

  private configureServer(): express.Express {
    const server: express.Express = express()
    server.use(bodyParser.json())
    server.use(cors())
    return server
  }

  private configureRoutes(): void {
    this.controllers
      .map(controller => this.mapControllerToRouter(controller))
      .forEach(router => this.addRouterToServer(router))
  }

  private configureErrorHandling(): void {
    this.server.use((err: object, _req: Request, res: Response, next: NextFunction): Response<Express> | void => {
      if ('status' in err && err.status === 400 && 'message' in err) {
        return res.status(err.status).json({ error: err.message })
      }
      return next(err)
    })

    this.server.use((_req: Request, res: Response): Response => {
      return res.status(404).json({ error: 'Not Found' })
    })

    this.server.use((err: object, _req: Request, res: Response, next: NextFunction): Response<Express> | void => {
      if ('status' in err && err.status === 500 && 'message' in err) {
        return res.status(500).json({ error: 'Internal Server Error' })
      }
      return next(err)
    })
  }

  private mapControllerToRouter(controller: BaseController): Router {
    const router: Router = Router()
    controller.getRoutes().forEach(route => router[route.method](route.path, route.action.bind(controller)))
    return router
  }

  private addRouterToServer(router: Router): void {
    this.server.use('/api', router)
  }

  public start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        this.logger.info(`Express REST server started on port ${port}.`)
        resolve()
      })
    })
  }
}
