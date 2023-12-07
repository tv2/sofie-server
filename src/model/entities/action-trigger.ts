export interface ActionTrigger {
  id: string
  actionId: string
  data: unknown // Defined by whatever frontend that needs to have an ActionTrigger
}
