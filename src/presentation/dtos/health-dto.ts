export class HealthDto {
  public readonly type: string
  public readonly statusCode: number
  public readonly state: string

  constructor(statusCode: number, state: string) {
    this.statusCode = statusCode
    this.state = state
    this.type = 'healthcheck'
  }
}
