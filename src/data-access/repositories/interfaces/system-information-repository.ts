import { SystemInformation } from '../../../model/entities/system-information'

export interface SystemInformationRepository {
  getSystemInformation(): Promise<SystemInformation>
}
