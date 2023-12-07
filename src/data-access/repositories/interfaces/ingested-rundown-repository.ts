import { IngestedRundown } from '../../../model/entities/ingested-rundown'

export interface IngestedRundownRepository {
  getIngestedRundowns(): Promise<IngestedRundown[]>
  getIngestedRundown(rundownId: string): Promise<IngestedRundown>
  deleteIngestedRundown(rundownId: string): Promise<void>
}
