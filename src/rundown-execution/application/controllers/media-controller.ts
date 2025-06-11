import { BaseController, GetRequest, RestController } from '../../../cross-cutting-concerns/application/controllers/base-controller'
import { Request, Response } from 'express'
import { MediaRepository } from '../../domain/repositories/media-repository'
import { HttpErrorHandler } from '../../../cross-cutting-concerns/application/interfaces/http-error-handler'
import { HttpResponseFormatter } from '../../../presentation/interfaces/http-response-formatter'
import { Media } from '../../domain/entities/media'
import { Exception } from '../../domain/exceptions/exception'
import { NotFoundException } from '../../domain/exceptions/not-found-exception'
import { MediaDto } from '../dtos/media-dto'
import { AuditLog } from '../../../cross-cutting-concerns/application/decorators/audit-log-decorator'

@RestController('/media')
export class MediaController extends BaseController {

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @AuditLog()
  @GetRequest()
  public async getMedia(_request: Request, response: Response): Promise<void> {
    try {
      const media: Media[] = await this.mediaRepository.getMedia()
      response.send(this.httpResponseFormatter.formatSuccessResponse(media.map(m => new MediaDto(m))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @AuditLog()
  @GetRequest('/:sourceName')
  public async getMediaById(request: Request, response: Response): Promise<void> {
    try {
      const sourceName: string = request.params.sourceName
      const media: Media | undefined = await this.mediaRepository.getMediaBySourceName(sourceName)
      if (!media) {
        throw new NotFoundException(`No Media for found for Media with source name ${sourceName}`)
      }
      response.send(this.httpResponseFormatter.formatSuccessResponse(new MediaDto(media)))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
