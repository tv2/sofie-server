import { Logger } from '../interfaces/logger'
import { ConsoleLogger } from '../../infrastructure/services/console-logger'

interface IncomingRequest {
  req?: {
    params?: unknown
    body?: unknown
  }
}

export function AuditLog(): MethodDecorator {
  const logger: Logger = new ConsoleLogger()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (_target: unknown, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): void => {
    const originalMethod: () => unknown = descriptor.value as () => unknown
    descriptor.value = function(...args: unknown[]): void {
      const argumentMessage: string = extractArgumentMessageFromIncomingRequest(args)
      logger.trace(`AuditLog - Method: "${JSON.stringify(propertyKey)}". ${argumentMessage}`)
      originalMethod.apply(this, args as []) // The "as []" is to comply with "yarn build".
    }
  }
}

function extractArgumentMessageFromIncomingRequest(args: unknown[]): string {
  for (let i: number = 0; i < args.length; i++) {
    const arg: IncomingRequest = args[i] as IncomingRequest
    if (!arg.req) {
      // Not an IncomingRequest
      continue
    }

    const argument: string = arg.req.params && Object.keys(arg.req.params).length !== 0 ? `Arguments: ${JSON.stringify(arg.req.params)}` : ''
    const body: string = arg.req.body && Object.keys(arg.req.body).length !== 0 ? `Body: ${JSON.stringify(arg.req.body)}` : ''
    return `${argument}${argument.length > 0 ? ' ' : ''}${body}`
  }

  return ''
}
