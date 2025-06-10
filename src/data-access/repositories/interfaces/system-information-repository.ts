import { SystemInformation } from '../../../rundown-execution/domain/entities/system-information'

export interface SystemInformationRepository {
  getSystemInformation(): Promise<SystemInformation>
}
