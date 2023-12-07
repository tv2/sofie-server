export interface EventServer {
  startServer(port: number): void
  killServer(): void
}
