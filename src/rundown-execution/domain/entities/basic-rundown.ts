import { RundownTiming } from '../value-objects/rundown-timing'
import { RundownMode } from '../enums/rundown-mode'
import { TakeMode } from '../enums/take-mode'

export class BasicRundown {
  public readonly id: string
  public readonly name: string
  public readonly timing: RundownTiming
  protected mode: RundownMode
  protected takeMode: TakeMode
  protected modifiedAt: number

  constructor(id: string, name: string, mode: RundownMode, takeMode: TakeMode, modifiedAt: number, timing: RundownTiming) {
    this.id = id
    this.name = name
    this.mode = mode
    this.takeMode = takeMode
    this.modifiedAt = modifiedAt
    this.timing = timing
  }

  public isActive(): boolean {
    return this.mode === RundownMode.ACTIVE
  }

  public isRehearsal(): boolean {
    return this.mode === RundownMode.REHEARSAL
  }

  public getMode(): RundownMode {
    return this.mode
  }

  public getTakeMode(): TakeMode {
    return this.takeMode
  }

  public getLastTimeModified(): number {
    return this.modifiedAt
  }
}
