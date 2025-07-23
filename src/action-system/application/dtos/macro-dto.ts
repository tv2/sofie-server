import { Macro, Operation } from '../../domain/entities/macro'

export class MacroDto {
  public readonly id: string
  public readonly name: string
  public readonly operations: Operation[]

  public constructor(macro: Macro) {
    this.id = macro.id
    this.name = macro.name
    this.operations = macro.operations
  }
}
