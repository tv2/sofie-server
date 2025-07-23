export class FrameTimeConverter {
  public constructor(private readonly frameRate: number) {}

  public convertFramesToMilliseconds(frames: number): number {
    return 1000 * frames / this.frameRate
  }
}
