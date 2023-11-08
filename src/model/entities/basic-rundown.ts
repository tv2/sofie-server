import { RundownTiming } from '../value-objects/rundown-timing'

export class BasicRundown {
  public readonly id: string
  public readonly name: string
  public readonly timing
  protected isRundownActive: boolean
  protected modifiedAt: number

  constructor(id: string, name: string, isActive: boolean, modifiedAt: number, timing: RundownTiming) {
    this.id = id
    this.name = name
    this.isRundownActive = isActive
    this.modifiedAt = modifiedAt
    this.timing = timing
  }

  public isActive(): boolean {
    return this.isRundownActive
  }

  public getLastTimeModified(): number {
    return this.modifiedAt
  }
}
