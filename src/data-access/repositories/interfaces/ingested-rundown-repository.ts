import { IngestedRundown } from '../../../model/entities/ingested-rundown'

export interface IngestedRundownRepository {
  getIngestedRundownIds(): Promise<readonly string[]>
  getIngestedRundown(rundownId: string): Promise<IngestedRundown>
  deleteIngestedRundown(rundownId: string): Promise<void>
}
