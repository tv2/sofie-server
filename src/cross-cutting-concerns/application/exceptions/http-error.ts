export class HttpError extends Error {
  constructor(public readonly code: HttpErrorCode, public readonly message: string) {
    super(message)
  }
}

export enum HttpErrorCode {
  CONNECTION_REFUSED = 'ECONNREFUSED',
  BAD_REQUEST = 'BAD_REQUEST',
}
