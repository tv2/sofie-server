import { HttpService } from './interfaces/http-service'
import got from 'got'

export class GotHttpService implements HttpService {

  public post(url: string, body: unknown): unknown {
    return got.post(url, body || undefined)
  }
}
