export interface EventServer {
  startServer(port: number): void
  stopServer(): void
}
