export type EventListener = (eventText: string) => (string | undefined)

export interface EventServer {
  startServer(port: number): Promise<void>
  setEventListener(listener: EventListener): void
  emitEvent(event: string): void
  stopServer(): void
}
