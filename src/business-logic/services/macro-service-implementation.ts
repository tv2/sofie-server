import { MacroService } from './interfaces/macro-service'
import { MacroRepository } from '../../data-access/repositories/interfaces/macro-repository'
import { Macro } from '../../model/entities/macro'
import { MacroEventEmitter } from './interfaces/macro-event-emitter'

export class MacroServiceImplementation implements MacroService {
  constructor(
    private readonly macroEventEmitter: MacroEventEmitter,
    private readonly macroRepository: MacroRepository) {
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
}
