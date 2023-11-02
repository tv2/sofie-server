import { BaseController, PostRequest, RestController } from './base-controller'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { Exception } from '../../model/exceptions/exception'
import { Request, Response } from 'express'
import { IngestService } from '../../business-logic/services/interfaces/ingest-service'

@RestController('/ingest-operations')
export class IngestController extends BaseController {

  constructor(private readonly ingestService: IngestService, private readonly httpErrorHandler: HttpErrorHandler) {
    super()
  }

  @PostRequest('/rundowns/:rundownName/reingest-data')
  public async reloadRundownData(req: Request, res: Response): Promise<void> {
    try {
      const rundownName: string = req.params.rundownName
      await this.ingestService.reloadIngestData(rundownName)
      res.send(`Reingested rundown data for ${rundownName}`)
    } catch (error) {
      this.httpErrorHandler.handleError(res, error as Exception)
    }
  }
}
