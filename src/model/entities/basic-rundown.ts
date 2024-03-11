import { RundownTiming } from '../value-objects/rundown-timing'
import { RundownMode } from '../enums/rundown-mode'

export class BasicRundown {
  public readonly id: string
  public readonly name: string
  public readonly timing: RundownTiming
  protected mode: RundownMode
  protected modifiedAt: number

  constructor(id: string, name: string, mode: RundownMode, modifiedAt: number, timing: RundownTiming) {
    this.id = id
    this.name = name
    this.mode = mode
    this.modifiedAt = modifiedAt
    this.timing = timing
  }

  public isActive(): boolean {
    return this.mode === RundownMode.ACTIVE
  }

  public getMode(): RundownMode {
    return this.mode
  }

  public getLastTimeModified(): number {
    return this.modifiedAt
  }
}
