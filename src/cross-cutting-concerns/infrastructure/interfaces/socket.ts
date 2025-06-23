export interface Socket {
  connect(
    connectionString: string,
    onConnected: () => void,
    onData: (data: unknown) => void,
    onError: () => void,
    onClose: (isClosedByError: boolean) => void
  ): void
  disconnect(): void
}
