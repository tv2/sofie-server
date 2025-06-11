import { SystemInformation } from '../entities/system-information'

export interface SystemInformationRepository {
  getSystemInformation(): Promise<SystemInformation>
}
