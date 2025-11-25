export interface HttpService {
  post(url: string, body?: string): Promise<unknown> // Can throw an HttpError
}
