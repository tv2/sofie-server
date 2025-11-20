import { HttpService } from '../../application/interfaces/http-service'
import { HttpError, HttpErrorCode } from '../../application/exceptions/http-error'

export class FetchHttpService implements HttpService {
  public async post(url: string, body?: string): Promise<unknown> {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch((error: unknown) => {
      if (this.isConnectionRefusedFetchError(error)) {
        throw new HttpError(HttpErrorCode.CONNECTION_REFUSED, 'Connection refused.')
      }
      throw error
    })
    if (response.ok) {
      return response
    }

    const bodyText: string = await response.text()
    if (bodyText) {
      throw new HttpError(HttpErrorCode.BAD_REQUEST, bodyText)
    }
    throw new HttpError(HttpErrorCode.BAD_REQUEST, response.statusText)
  }

  private isConnectionRefusedFetchError(error: unknown): boolean {
    return error instanceof TypeError && error.cause instanceof AggregateError && 'code' in error.cause && error.cause.code === HttpErrorCode.CONNECTION_REFUSED
  }
}
