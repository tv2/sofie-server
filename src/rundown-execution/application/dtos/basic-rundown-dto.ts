import { BasicRundown } from '../../domain/entities/basic-rundown'
import { RundownTiming } from '../../domain/value-objects/rundown-timing'
import { RundownMode } from '../../domain/enums/rundown-mode'
import { TakeMode } from '../../domain/enums/take-mode'

export class BasicRundownDto {
  public readonly id: string
  public readonly name: string
  public readonly mode: RundownMode
  public readonly takeMode: TakeMode
  public readonly modifiedAt: number
  public readonly timing: RundownTiming

  public constructor(basicRundown: BasicRundown) {
    this.id = basicRundown.id
    this.name = basicRundown.name
    this.mode = basicRundown.getMode()
    this.takeMode = basicRundown.getTakeMode()
    this.modifiedAt = basicRundown.getLastTimeModified()
    this.timing = basicRundown.timing
  }
}
