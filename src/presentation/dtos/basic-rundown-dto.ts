import { BasicRundown } from '../../model/entities/basic-rundown'

export class BasicRundownDto {
  public readonly id: string
  public readonly name: string
  public readonly isActive: boolean
  public readonly modifiedAt: number

  constructor(basicRundown: BasicRundown) {
    this.id = basicRundown.id
    this.name = basicRundown.name
    this.isActive = basicRundown.isActive()
    this.modifiedAt = basicRundown.getLastTimeModified()
  }
}
