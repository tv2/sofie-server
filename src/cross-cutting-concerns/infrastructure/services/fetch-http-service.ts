import { HttpService } from '../../application/interfaces/http-service'
import { HttpError, HttpErrorCode } from '../../application/exceptions/http-error'

export class FetchHttpService implements HttpService {
  public async post(url: string, body?: string): Promise<unknown> {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    if (response.ok) {
      return response
    }

    const bodyText: string = await response.text()
    if (bodyText) {
      throw new HttpError(HttpErrorCode.BAD_REQUEST, bodyText)
    }
    if (response.statusText === HttpErrorCode.CONNECTION_REFUSED) {
      throw new HttpError(HttpErrorCode.CONNECTION_REFUSED, 'Connection refused.')
    }
    throw new HttpError(HttpErrorCode.BAD_REQUEST, response.statusText)
  }
}
