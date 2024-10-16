export class ApiError {
  constructor(private readonly message: string) {
  }

  public toJson(): string {
    return `error: { message: ${this.message} } `
  }
}                                                                             