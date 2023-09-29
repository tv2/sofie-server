export interface DataChangedListener {
  onCreated(onCreatedCallback: (id: string) => Promise<void>): void
  onDeleted(onDeletedCallback: (id: string) => Promise<void>): void
}
