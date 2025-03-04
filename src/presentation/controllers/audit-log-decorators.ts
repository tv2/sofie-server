import { Logger } from '../../logger/logger'
import { LoggerFacade } from '../../logger/logger-facade'

export function AuditLog(): MethodDecorator {
  const logger: Logger = LoggerFacade.createLogger()

  return (_target: unknown, propertyKey: string, descriptor: TypedPropertyDescriptor<unknown>) => {
    const originalMethod: () => unknown = descriptor.value as () => unknown
    descriptor.value = function (...args: unknown[]): void {
      logger.trace(`AuditLog: "${propertyKey} was called!`)
      originalMethod.apply(this, args)
    }
  }
}
