import { BaseController, GetRequest, RestController } from './base-controller'
import { Request, Response } from 'express'
import { MediaRepository } from '../../data-access/repositories/interfaces/MediaRepository'
import { HttpErrorHandler } from '../interfaces/http-error-handler'
import { HttpResponseFormatter } from '../interfaces/http-response-formatter'
import { Media } from '../../model/entities/media'
import { Exception } from '../../model/exceptions/exception'
import { NotFoundException } from '../../model/exceptions/not-found-exception'

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
      response.send(this.httpResponseFormatter.formatSuccessResponse(media))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }

  @GetRequest('/:mediaId')
  public async getMediaById(request: Request, response: Response): Promise<void> {
    try {
      const mediaId: string = request.params.mediaId
      const media: Media | undefined = await this.mediaRepository.getMediaById(mediaId)
      if (!media) {
        throw new NotFoundException(`No Media for found for MediaId ${mediaId}`)
      }
      response.send(this.httpResponseFormatter.formatSuccessResponse(media))
    } catch (error) {
      this.httpErrorHandler.handleError(response, error as Exception)
    }
  }
}
