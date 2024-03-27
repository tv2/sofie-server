import { BasicRundown } from '../../model/entities/basic-rundown'
import { RundownTiming } from '../../model/value-objects/rundown-timing'
import { RundownMode } from '../../model/enums/rundown-mode'

export class BasicRundownDto {
  public readonly id: string
  public readonly name: string
  public readonly mode: RundownMode
  public readonly modifiedAt: number
  public readonly timing: RundownTiming

  constructor(basicRundown: BasicRundown) {
    this.id = basicRundown.id
    this.name = basicRundown.name
    this.mode = basicRundown.getMode()
    this.modifiedAt = basicRundown.getLastTimeModified()
    this.timing = basicRundown.timing
  }
}
