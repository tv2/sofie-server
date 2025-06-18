export interface EventServer {
  startServer(port: number): Promise<void>
  stopServer(): void
}
