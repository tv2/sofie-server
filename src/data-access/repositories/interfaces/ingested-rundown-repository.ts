import { IngestedRundown } from '../../../rundown-execution/domain/entities/ingested-rundown'

export interface IngestedRundownRepository {
  getIngestedRundownIds(): Promise<readonly string[]>
  getIngestedRundown(rundownId: string): Promise<IngestedRundown>
  deleteIngestedRundown(rundownId: string): Promise<void>
}
