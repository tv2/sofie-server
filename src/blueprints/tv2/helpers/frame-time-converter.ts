export class FrameTimeConverter {
  constructor(private readonly frameRate: number) {}

  public convertFramesToMilliseconds(frames: number): number {
    return 1000 * frames / this.frameRate
  }
}
