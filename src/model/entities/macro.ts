export interface Macro {
  id: string
  name: string
  operations: Operation[]
}

export type Operation = ActionOperation

interface BaseOperation {
  type: OperationType
  delayNextOperationMs: number
}

interface ActionOperation extends BaseOperation {
  type: OperationType.ACTION
  actionId: string
  actionArguments?: unknown
}

export enum OperationType {
  ACTION = 'ACTION'
}
