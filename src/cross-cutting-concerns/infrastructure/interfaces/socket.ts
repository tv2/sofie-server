export interface Socket {
  setHealthStatusIdentifier(healthStatusIdentifier: string): void
  connect<T>(
    connectionString: string,
    onData: (data: T) => void
  ): void
  disconnect(): void
}
