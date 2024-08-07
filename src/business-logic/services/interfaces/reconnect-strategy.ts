export interface ReconnectStrategy {
  connected(): void
  disconnected(connect: () => void): void
}