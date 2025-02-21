import { Macro } from '../../../model/entities/macro'

export interface MacroRepository {
  getMacro(macroId: string): Promise<Macro>
  getMacros(): Promise<Macro[]>
  createMacro(macro: Omit<Macro, 'id'>): Promise<Macro>
  updateMacro(macro: Macro): Promise<Macro>
  deleteMacro(macroId: string): Promise<void>
}
