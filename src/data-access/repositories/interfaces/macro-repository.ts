import { Macro } from '../../../rundown-execution/domain/entities/macro'

export interface MacroRepository {
  getMacro(macroId: string): Promise<Macro>
  getMacros(): Promise<Macro[]>
  createMacro(macro: Macro): Promise<Macro>
  updateMacro(macro: Macro): Promise<Macro>
  deleteMacro(macroId: string): Promise<void>
}
