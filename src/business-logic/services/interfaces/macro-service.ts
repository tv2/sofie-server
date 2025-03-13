import { Macro } from '../../../model/entities/macro'

export interface MacroService {
  getMacro(macroId: string): Promise<Macro>
  getMacros(): Promise<Macro[]>
  createMacro(macro: Macro): Promise<void>
  updateMacro(macro: Macro): Promise<void>
  deleteMacro(macroId: string): Promise<void>
  executeMacro(macroId: string, rundownId: string): Promise<void>
}
