import { BaseController, GetRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { MediaRepository } from '../../data-access/repositories/interfaces/MediaRepository'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { Media } from '../../model/entities/media'
import { Exception } from '../../model/exceptions/exception'
import { NotFoundException } from '../../model/exceptions/not-found-exception'
import { MediaDto } from '../dtos/media-dto'

@RestController('/media')
export class MediaController extends BaseController {

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly httpErrorHandler: HttpErrorHandler,
    private readonly httpResponseFormatter: HttpResponseFormatter
  ) {
    super()
  }

  @GetRequest()
  public async getMedia(_request: Request, response: Response): Promise<void> {
    try {
      const media: Media[] = await this.mediaRepository.getMedia()
      response.send(this.httpResponseFormatter.formatSuccessResponse(media.map(m => new MediaDto(m))))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

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
