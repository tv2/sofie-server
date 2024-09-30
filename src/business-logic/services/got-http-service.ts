import { HttpService } from './interfaces/http-service'
import got from 'got'

export class GotHttpService implements HttpService {

  public post(url: string, body?: string): unknown {
    return got.post(url, { body }).catch(error => { throw new Error(error.response.body) })
  }
}
