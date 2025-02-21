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
}

enum OperationType {
  ACTION = 'ACTION'
}
