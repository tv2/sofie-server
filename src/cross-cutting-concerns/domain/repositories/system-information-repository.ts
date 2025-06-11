import { SystemInformation } from '../value-objects/system-information'

export interface SystemInformationRepository {
  getSystemInformation(): Promise<SystemInformation>
}
