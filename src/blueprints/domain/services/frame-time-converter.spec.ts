import { FrameTimeConverter } from './frame-time-converter'

describe(FrameTimeConverter.name, () => {
  describe(FrameTimeConverter.prototype.convertFramesToMilliseconds.name, () => {
    const testSuites: Map<number, { frames: number, milliseconds: number }[]> = new Map([
      [
        25,
        [
          { frames: 0, milliseconds: 0 },
          { frames: 25, milliseconds: 1000 },
          { frames: 50, milliseconds: 2000 },
          { frames: 100, milliseconds: 4000 },
        ]
      ],
      [
        50,
        [
          { frames: 0, milliseconds: 0 },
          { frames: 25, milliseconds: 500 },
          { frames: 50, milliseconds: 1000 },
          { frames: 100, milliseconds: 2000 },
        ]
      ],
    ])

    testSuites.forEach((testCases, frameRate) =>
      describe(`when frame rate is ${frameRate}`, () =>
        testCases.forEach(testCase => describe(`when ${testCase.frames} frames are given`, () => {
          it(`returns ${testCase.milliseconds}`, () => {
            const testee: FrameTimeConverter = createTestee({frameRate: frameRate})

            const result: number = testee.convertFramesToMilliseconds(testCase.frames)

            expect(result).toBe(testCase.milliseconds)
          })
        }))
      )
    )
  })
})

function createTestee(params: { frameRate: number }): FrameTimeConverter {
  return new FrameTimeConverter(params.frameRate)
}
