import {HttpRequestParameters, HttpService} from './interfaces/http-service'
import got, { Response } from 'got'

export class GotHttpService implements HttpService {

  public async post(httpParameters: HttpRequestParameters): Promise<Response<string>> {
    const url: string = httpParameters.url
    return got.post(url)
  }
}
