export interface Socket {
  connect(ipAddress: string): void
  disconnect(): void

  subscribeToOnConnected(onConnected: () => void): void
  subscribeToOnClosed(onClosed: (isClosedByError: boolean) => void): void
  subscribeToData(onData: (data: unknown) => void): void
  subscribeToError(onError: () => void): void
}
