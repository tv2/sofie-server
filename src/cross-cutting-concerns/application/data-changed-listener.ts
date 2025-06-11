export interface DataChangedListener<T> {
  onCreated(onCreatedCallback: (data: T) => void): void
  onUpdated(onUpdatedCallback: (data: T) => void): void
  onDeleted(onDeletedCallback: (id: string) => void): void
}
