import { SystemInformation } from '../../domain/entities/system-information'

export class SystemInformationDto {

  public readonly name: string

  constructor(systemInformation: SystemInformation) {
    this.name = systemInformation.name
  }
}
