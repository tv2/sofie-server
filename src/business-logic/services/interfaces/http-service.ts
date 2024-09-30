export interface HttpErrorResponse {
  code: HttpErrorResponseCode
}

export enum HttpErrorResponseCode {
  CONNECTION_REFUSED = 'ECONNREFUSED'
}

export interface HttpService {
  post(url: string, body?: string): unknown
}
