import { SystemInformation } from '../../domain/value-objects/system-information'

export class SystemInformationDto {
  public readonly name: string

  public constructor(systemInformation: SystemInformation) {
    this.name = systemInformation.name
  }
}
