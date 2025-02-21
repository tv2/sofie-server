import { MacroService } from './interfaces/macro-service'
import { MacroRepository } from '../../data-access/repositories/interfaces/macro-repository'
import { Macro } from '../../model/entities/macro'

export class MacroServiceImplementation implements MacroService {
  constructor(private readonly macroRepository: MacroRepository) {
  }

  public async getMacro(macroId: string): Promise<Macro> {
    return this.macroRepository.getMacro(macroId)
  }

  public async getMacros(): Promise<Macro[]> {
    return this.macroRepository.getMacros()
  }

  public async createMacro(macro: Macro): Promise<void> {
    await this.macroRepository.createMacro(macro)
  }

  public async updateMacro(macro: Macro): Promise<void> {
    await this.macroRepository.updateMacro(macro)
  }

  public async deleteMacro(macroId: string): Promise<void> {
    await this.macroRepository.deleteMacro(macroId)
  }
}
