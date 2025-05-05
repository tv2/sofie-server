import { PlayoutContentStateService } from '../playout-content-state-service'
import { PlayoutContentEventEmitter } from '../interfaces/playout-content-event-emitter'
import { anything, capture, instance, mock, resetCalls, verify } from '@typestrong/ts-mockito'
import { PlayoutContentUpdateService } from '../interfaces/playout-content-service'
import { Rundown } from '../../../model/entities/rundown'
import { EntityTestFactory } from '../../../model/entities/test/entity-test-factory'
import { Part } from '../../../model/entities/part'
import { Segment } from '../../../model/entities/segment'
import { RundownMode } from '../../../model/enums/rundown-mode'
import { PlayoutContent } from '../../../model/value-objects/playout-content'
import { Piece } from '../../../model/entities/piece'
import { Owner } from '../../../model/enums/owner'
import { PlayoutContentType } from '../../../model/enums/playout-content-type'

describe(PlayoutContentStateService.name, () => {
  describe(PlayoutContentStateService.prototype.updatePlayoutContentState.name, () => {
    let playoutContentEventEmitter: PlayoutContentEventEmitter

    beforeEach(() => {
      playoutContentEventEmitter = mock<PlayoutContentEventEmitter>()
    })

    describe('the Rundown is not active', () => {
      describe('there is no change in PlayoutContents', () => {
        it('does not emit a ProgramPlayoutContent', () => {
          const rundown: Rundown = EntityTestFactory.createRundown({})
          const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))

          testee.updatePlayoutContentState(rundown)

          verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
        })

        it('does not emit a PreviewPlayoutContent', () => {
          const rundown: Rundown = EntityTestFactory.createRundown({})
          const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))

          testee.updatePlayoutContentState(rundown)

          verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
        })
      })

      describe('there is a change in PlayoutContents', () => {
        let testee: PlayoutContentUpdateService

        beforeEach(() => {
          const activeRundownWithProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({
            program: [{ type: PlayoutContentType.AUDIO }],
            preview: [{ type: PlayoutContentType.COMMAND }]
          })
          testee = new PlayoutContentStateService(instance(playoutContentEventEmitter))

          testee.updatePlayoutContentState(activeRundownWithProgramPlayoutContent)
          resetCalls(playoutContentEventEmitter)
        })

        it('emits an empty ProgramPlayoutContentEvent', () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.INACTIVE })
          testee.updatePlayoutContentState(rundown)

          const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
          expect(programPlayoutContents).toHaveLength(0)
        })

        it('emits an empty PreviewPlayoutContentEvent', () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.INACTIVE })
          testee.updatePlayoutContentState(rundown)

          const [previewPlayoutContents] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
          expect(previewPlayoutContents).toHaveLength(0)
        })
      })
    })

    describe('there is no active Part', () => {
      describe('the programPlayoutContents is already empty', () => {
        it('does not emit a ProgramPlayoutContentEvent', () => {
          const rundownWithNoActivePart: Rundown = EntityTestFactory.createRundown({
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: undefined,
              nextCursor: {
                part: EntityTestFactory.createPart(),
                segment: EntityTestFactory.createSegment(),
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          })

          const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))
          testee.updatePlayoutContentState(rundownWithNoActivePart)

          verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
        })
      })

      describe('the programPlayoutContents is not empty', () => {
        it('emits an empty ProgramPlayoutEvent', () => {
          const rundownWithProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [{ type: PlayoutContentType.COMMAND }]})
          const rundownWithNoActivePart: Rundown = EntityTestFactory.createRundown({
            mode: RundownMode.ACTIVE,
            alreadyActiveProperties: {
              activeCursor: undefined,
              nextCursor: {
                part: EntityTestFactory.createPart(),
                segment: EntityTestFactory.createSegment(),
                owner: Owner.SYSTEM
              },
              infinitePieces: new Map()
            }
          })

          const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))
          // To detect no change, we need to have called it once, then we need to call it again
          testee.updatePlayoutContentState(rundownWithProgramPlayoutContent)
          // By resetting the mock after the first call, we have a "clean slate" for our mock.
          resetCalls(playoutContentEventEmitter)

          testee.updatePlayoutContentState(rundownWithNoActivePart)

          const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
          expect(programPlayoutContents).toHaveLength(0)
        })
      })
    })

    describe('there is no change in PlayoutContents', () => {
      it('does not emit a ProgramPlayoutContentEvent', () => {
        const rundown: Rundown = createActiveRundownWithPlayoutContents()
        const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))

        // To detect no change, we need to have called it once, then we need to call it again
        testee.updatePlayoutContentState(rundown)
        // By resetting the mock after the first call, we can utilize the "never()" method in the verify.
        resetCalls(playoutContentEventEmitter)
        testee.updatePlayoutContentState(rundown)

        verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
      })

      it('does not emit a PreviewPlayoutContentEvent', () => {
        const rundown: Rundown = createActiveRundownWithPlayoutContents()
        const testee: PlayoutContentUpdateService = new PlayoutContentStateService(instance(playoutContentEventEmitter))

        // To detect no change, we need to have called it once, then we need to call it again
        testee.updatePlayoutContentState(rundown)
        // By resetting the mock after the first call, we can utilize the "never()" method in the verify.
        resetCalls(playoutContentEventEmitter)
        testee.updatePlayoutContentState(rundown)

        verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
      })
    })

    describe('there is a change to PlayoutContents in the active Part', () => {
      let testee: PlayoutContentUpdateService

      beforeEach(() => {
        // We need to set up some data, so there is actually going to be a change when called again.
        const rundownWithSetupProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [{ type: PlayoutContentType.CAMERA, source: 'setupCameraSource' }]})
        testee = new PlayoutContentStateService(instance(playoutContentEventEmitter))
        testee.updatePlayoutContentState(rundownWithSetupProgramPlayoutContent)
        // We need to reset the mock so each test has a clean slate.
        resetCalls(playoutContentEventEmitter)
      })

      it('does not emit a PreviewPlayoutContentEvent', () => {
        const rundownWithoutNextPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [] })
        testee.updatePlayoutContentState(rundownWithoutNextPlayoutContent)

        verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
      })

      describe('it emits a ProgramPlayoutContentEvent', () => {
        describe('active Part has zero Pieces', () => {
          it('emits an empty array of PlayoutContents', () => {
            const rundownWithoutProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [] })
            testee.updatePlayoutContentState(rundownWithoutProgramPlayoutContent)

            const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(programPlayoutContents).toHaveLength(0)
          })
        })

        describe('active Part has one Piece', () => {
          it('emits an array of one PlayoutContent', () => {
            const programPlayoutContents: PlayoutContent[] = [{ type: PlayoutContentType.CAMERA, source: 'someSource' }]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })

        describe('active Part has two Pieces', () => {
          it('emits an array of two PlayoutContents', () => {
            const programPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.CAMERA, source: 'someSource' },
              { type: PlayoutContentType.GRAPHICS }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })

        describe('active Part has five Pieces', () => {
          it('emits an array of five PlayoutContents', () => {
            const programPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.CAMERA, source: 'someSource' },
              { type: PlayoutContentType.GRAPHICS },
              { type: PlayoutContentType.AUDIO },
              { type: PlayoutContentType.REMOTE, source: 'someRemoteSource'},
              { type: PlayoutContentType.COMMAND }
            ]

            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })
      })
    })

    describe('there is a change to PlayoutContents in the next Part', () => {
      let testee: PlayoutContentUpdateService

      beforeEach(() => {
        // We need to set up some data, so there is actually going to be a change when called again.
        const rundownWithSetupPreviewPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [{ type: PlayoutContentType.CAMERA, source: 'setupCameraSource' }]})
        testee = new PlayoutContentStateService(instance(playoutContentEventEmitter))
        testee.updatePlayoutContentState(rundownWithSetupPreviewPlayoutContent)
        // We need to reset the mock so each test has a clean slate.
        resetCalls(playoutContentEventEmitter)
      })

      it('does not emit a ProgramPlayoutContentEvent', () => {
        const rundownWithoutNextPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [] })
        testee.updatePlayoutContentState(rundownWithoutNextPlayoutContent)

        verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
      })

      describe('it emits a PreviewPlayoutContentEvent', () => {
        describe('next Part has zero Pieces', () => {
          it('emits an empty array of PlayoutContents', () => {
            const rundownWithoutPreviewPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [] })
            testee.updatePlayoutContentState(rundownWithoutPreviewPlayoutContent)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual([])
          })
        })

        describe('next Part has one Piece', () => {
          it('emits an array of one PlayoutContent', () => {
            const previewPlayoutContents: PlayoutContent[] = [{ type: PlayoutContentType.REMOTE, source: 'remoteSource' }]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })

        describe('next Part has two Pieces', () => {
          it('emits an array of two PlayoutContents', () => {
            const previewPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.REMOTE, source: 'remoteSource' },
              { type: PlayoutContentType.MANUS }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })

        describe('next Part has five Pieces', () => {
          it('emits an array of five PlayoutContents', () => {
            const previewPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.REMOTE, source: 'remoteSource' },
              { type: PlayoutContentType.MANUS },
              { type: PlayoutContentType.COMMAND },
              { type: PlayoutContentType.REPLAY, source: 'replaySource' },
              { type: PlayoutContentType.AUDIO }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })
      })
    })
  })
})

function createActiveRundownWithPlayoutContents(playoutContents?: { program?: PlayoutContent[], preview?: PlayoutContent[] }): Rundown {
  const programPieces: Piece[] = playoutContents?.program?.map(playoutContent => EntityTestFactory.createPiece({ metadata: { playoutContent }})) ?? []
  const previewPieces: Piece[] = playoutContents?.preview?.map(playoutContent => EntityTestFactory.createPiece({ metadata: { playoutContent }})) ?? []

  const activePart: Part = EntityTestFactory.createPart({
    pieces: programPieces
  })

  const nextPart: Part = EntityTestFactory.createPart({
    pieces: previewPieces
  })

  const segment: Segment = EntityTestFactory.createSegment({ parts: [activePart, nextPart] })
  return EntityTestFactory.createRundown({
    mode: RundownMode.ACTIVE,
    alreadyActiveProperties: {
      activeCursor: {
        part: activePart,
        segment: segment,
        owner: Owner.SYSTEM
      },
      nextCursor: {
        part: nextPart,
        segment: segment,
        owner: Owner.SYSTEM
      },
      infinitePieces: new Map()
    },
    segments: [segment]
  })
}
