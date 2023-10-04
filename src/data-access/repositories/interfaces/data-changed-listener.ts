export interface DataChangedListener<T> {
  onCreated(onCreatedCallback: (data: T) => Promise<void>): void
  onUpdated(onUpdatedCallback: (data: T) => Promise<void>): void
  onDeleted(onDeletedCallback: (id: string) => Promise<void>): void
}
