import { HttpService } from '../application/http-service'
import got from 'got'
import { HttpError, HttpErrorCode } from '../application/http-error'

export class GotHttpService implements HttpService {

  public post(url: string, body?: string): unknown {
    return got.post(url, { body }).catch(error => {
      const bodyText: string = error.response?.body
      if (bodyText) {
        throw new HttpError(HttpErrorCode.BAD_REQUEST, bodyText)
      }
      if (error.code === HttpErrorCode.CONNECTION_REFUSED) {
        throw new HttpError(HttpErrorCode.CONNECTION_REFUSED, 'Connection refused.')
      }
      throw error
    })
  }
}
