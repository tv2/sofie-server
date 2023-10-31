export interface HttpRequestParameters {
  url: string
  payload?: unknown
}

export interface HttpService {
  post(httpParameters: HttpRequestParameters): Promise<unknown>
}
