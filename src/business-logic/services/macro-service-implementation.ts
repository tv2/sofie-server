import { MacroService } from './interfaces/macro-service'
import { MacroRepository } from '../../data-access/repositories/interfaces/macro-repository'
import { Macro, Operation, OperationType } from '../../model/entities/macro'
import { MacroEventEmitter } from './interfaces/macro-event-emitter'
import { ActionService } from './interfaces/action-service'
import { Exception } from '../../model/exceptions/exception'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { StatusMessageEventEmitter } from './interfaces/status-message-event-emitter'
import { StatusCode } from '../../model/enums/status-code'

export class MacroServiceImplementation implements MacroService {
  constructor(
    private readonly statusMessageEventEmitter: StatusMessageEventEmitter,
    private readonly macroEventEmitter: MacroEventEmitter,
    private readonly macroRepository: MacroRepository,
    private readonly actionService: ActionService,
  ) {
  }

  public async getMacro(macroId: string): Promise<Macro> {
    return this.macroRepository.getMacro(macroId)
  }

  public async getMacros(): Promise<Macro[]> {
    return this.macroRepository.getMacros()
  }

  public async createMacro(macro: Macro): Promise<void> {
    const createdMacro: Macro = await this.macroRepository.createMacro(macro)
    this.macroEventEmitter.emitMacroCreatedEvent(createdMacro)
  }

  public async updateMacro(macro: Macro): Promise<void> {
    const updatedMacro: Macro = await this.macroRepository.updateMacro(macro)
    this.macroEventEmitter.emitMacroUpdatedEvent(updatedMacro)
  }

  public async deleteMacro(macroId: string): Promise<void> {
    await this.macroRepository.deleteMacro(macroId)
    this.macroEventEmitter.emitMacroDeletedEvent(macroId)
  }

  public async executeMacro(macroId: string, rundownId: string): Promise<void> {
    const macro: Macro = await this.macroRepository.getMacro(macroId)
    await this.executeOperationAtIndex(rundownId, macro, 0)
  }

  private async executeOperationAtIndex(rundownId: string, macro: Macro, index: number): Promise<void> {
    if (index >= macro.operations.length) {
      return
    }
    const operation: Operation = macro.operations[index]
    try {
      await this.executeOperation(rundownId, operation)
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(() => this.executeOperationAtIndex(rundownId, macro, index + 1), operation.delayNextOperationMs)
    }
    catch (error: unknown) {
      let errorMessage: string = 'The operation failed for an unknown reason.'
      if (error instanceof Exception) {
        errorMessage = error.message
      }
      this.statusMessageEventEmitter.emitStatusMessageEvent({id: 'OperationFailed', message: errorMessage, statusCode: StatusCode.BAD, title: 'Operation Failed'})
    }
  }

  public async executeOperation(rundownId: string, operation: Operation): Promise<void> {
    switch (operation.type) {
      case OperationType.ACTION: {
        await this.actionService.executeAction(operation.actionId, rundownId, operation.actionArguments)
        break
      }
      default:
        throw new UnsupportedOperationException(`Unsupported operation type ${operation.type}.`)
    }
  }
}
