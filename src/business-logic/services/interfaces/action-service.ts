export interface ActionService {
  executeAction(actionId: string, rundownId: string, actionArguments: unknown): Promise<void>
}
