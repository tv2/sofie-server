export interface HttpService {
  post(url: string, body?: string): unknown // Can throw an HttpError
}
