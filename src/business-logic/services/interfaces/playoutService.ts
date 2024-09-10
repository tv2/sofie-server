export interface PlayoutService {
  makeDevicesReady(okToDestroyStuff: boolean, activeRundownId: string): Promise<void>
  makeDevicesStandDown(): Promise<void>
}
