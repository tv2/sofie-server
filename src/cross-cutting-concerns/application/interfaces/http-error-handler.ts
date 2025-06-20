import { Response } from 'express'
import { Exception } from '../../domain/exceptions/exception'

export interface HttpErrorHandler {
  handleError(response: Response, exception: Exception): void
}
