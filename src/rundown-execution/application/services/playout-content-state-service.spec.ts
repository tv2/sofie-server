import { PlayoutContentStateService } from './playout-content-state-service'
import { PlayoutContentEventEmitter } from '../interfaces/playout-content-event-emitter'
import { anything, capture, instance, mock, resetCalls, verify } from '@typestrong/ts-mockito'
import { PlayoutContentUpdateService } from '../interfaces/playout-content-service'
import { Rundown } from '../../domain/entities/rundown'
import { EntityTestFactory } from '../../domain/entities/test/entity-test-factory'
import { Part } from '../../domain/entities/part'
import { Segment } from '../../domain/entities/segment'
import { RundownMode } from '../../domain/enums/rundown-mode'
import { PlayoutContent } from '../../domain/value-objects/playout-content'
import { Piece } from '../../domain/entities/piece'
import { Owner } from '../../domain/enums/owner'
import { PlayoutContentType } from '../../domain/enums/playout-content-type'
import { PlayoutContentRepository } from '../../domain/repositories/playout-content-repository'

describe(PlayoutContentStateService.name, () => {
  describe(PlayoutContentStateService.prototype.updatePlayoutContentState.name, () => {
    let playoutContentEventEmitter: PlayoutContentEventEmitter

    beforeEach(() => {
      playoutContentEventEmitter = mock<PlayoutContentEventEmitter>()
    })

    describe('the Rundown is not active', () => {
      describe('there is no change in PlayoutContents', () => {
        it('does not emit a ProgramPlayoutContent', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({})
          const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })

          await testee.updatePlayoutContentState(rundown)

          verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
        })

        it('does not emit a PreviewPlayoutContent', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({})
          const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })

          await testee.updatePlayoutContentState(rundown)

          verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
        })
      })

      describe('there is a change in PlayoutContents', () => {
        let testee: PlayoutContentUpdateService

        beforeEach(async () => {
          const activeRundownWithProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({
            program: [{ type: PlayoutContentType.AUDIO }],
            preview: [{ type: PlayoutContentType.COMMAND }]
          })
          testee = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })

          await testee.updatePlayoutContentState(activeRundownWithProgramPlayoutContent)
          resetCalls(playoutContentEventEmitter)
        })

        it('emits an empty ProgramPlayoutContentEvent', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.INACTIVE })
          await testee.updatePlayoutContentState(rundown)

          const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
          expect(programPlayoutContents).toHaveLength(0)
        })

        it('emits an empty PreviewPlayoutContentEvent', async () => {
          const rundown: Rundown = EntityTestFactory.createRundown({ mode: RundownMode.INACTIVE })
          await testee.updatePlayoutContentState(rundown)

          const [previewPlayoutContents] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
          expect(previewPlayoutContents).toHaveLength(0)
        })
      })
    })

    describe('there is no active Part', () => {
      describe('the programPlayoutContents is already empty', () => {
        it('does not emit a ProgramPlayoutContentEvent', async () => {
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

          const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })
          await testee.updatePlayoutContentState(rundownWithNoActivePart)

          verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
        })
      })

      describe('the programPlayoutContents is not empty', () => {
        it('emits an empty ProgramPlayoutEvent', async () => {
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

          const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })
          // To detect no change, we need to have called it once, then we need to call it again
          await testee.updatePlayoutContentState(rundownWithProgramPlayoutContent)
          // By resetting the mock after the first call, we have a "clean slate" for our mock.
          resetCalls(playoutContentEventEmitter)

          await testee.updatePlayoutContentState(rundownWithNoActivePart)

          const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
          expect(programPlayoutContents).toHaveLength(0)
        })
      })
    })

    describe('there is no change in PlayoutContents', () => {
      it('does not emit a ProgramPlayoutContentEvent', async () => {
        const rundown: Rundown = createActiveRundownWithPlayoutContents()
        const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })

        // To detect no change, we need to have called it once, then we need to call it again
        await testee.updatePlayoutContentState(rundown)
        // By resetting the mock after the first call, we can utilize the "never()" method in the verify.
        resetCalls(playoutContentEventEmitter)
        await testee.updatePlayoutContentState(rundown)

        verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
      })

      it('does not emit a PreviewPlayoutContentEvent', async () => {
        const rundown: Rundown = createActiveRundownWithPlayoutContents()
        const testee: PlayoutContentUpdateService = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })

        // To detect no change, we need to have called it once, then we need to call it again
        await testee.updatePlayoutContentState(rundown)
        // By resetting the mock after the first call, we can utilize the "never()" method in the verify.
        resetCalls(playoutContentEventEmitter)
        await testee.updatePlayoutContentState(rundown)

        verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
      })
    })

    describe('there is a change to PlayoutContents in the active Part', () => {
      let testee: PlayoutContentUpdateService

      beforeEach(async () => {
        // We need to set up some data, so there is actually going to be a change when called again.
        const rundownWithSetupProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [{ type: PlayoutContentType.CAMERA, source: 'setupCameraSource' }]})
        testee = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })
        await testee.updatePlayoutContentState(rundownWithSetupProgramPlayoutContent)
        // We need to reset the mock so each test has a clean slate.
        resetCalls(playoutContentEventEmitter)
      })

      it('does not emit a PreviewPlayoutContentEvent', async () => {
        const rundownWithoutNextPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [] })
        await testee.updatePlayoutContentState(rundownWithoutNextPlayoutContent)

        verify(playoutContentEventEmitter.emitPreviewPlayoutContentEvent(anything())).never()
      })

      describe('it emits a ProgramPlayoutContentEvent', () => {
        describe('active Part has zero Pieces', () => {
          it('emits an empty array of PlayoutContents', async () => {
            const rundownWithoutProgramPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [] })
            await testee.updatePlayoutContentState(rundownWithoutProgramPlayoutContent)

            const [programPlayoutContents] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(programPlayoutContents).toHaveLength(0)
          })
        })

        describe('active Part has one Piece', () => {
          it('emits an array of one PlayoutContent', async () => {
            const programPlayoutContents: PlayoutContent[] = [{ type: PlayoutContentType.CAMERA, source: 'someSource' }]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })

        describe('active Part has two Pieces', () => {
          it('emits an array of two PlayoutContents', async () => {
            const programPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.CAMERA, source: 'someSource' },
              { type: PlayoutContentType.GRAPHICS }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })

        describe('active Part has five Pieces', () => {
          it('emits an array of five PlayoutContents', async () => {
            const programPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.CAMERA, source: 'someSource' },
              { type: PlayoutContentType.GRAPHICS },
              { type: PlayoutContentType.AUDIO },
              { type: PlayoutContentType.REMOTE, source: 'someRemoteSource'},
              { type: PlayoutContentType.COMMAND }
            ]

            const rundown: Rundown = createActiveRundownWithPlayoutContents({ program: programPlayoutContents })

            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitProgramPlayoutContentEvent).last()
            expect(result).toEqual(programPlayoutContents)
          })
        })
      })
    })

    describe('there is a change to PlayoutContents in the next Part', () => {
      let testee: PlayoutContentUpdateService

      beforeEach(async () => {
        // We need to set up some data, so there is actually going to be a change when called again.
        const rundownWithSetupPreviewPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [{ type: PlayoutContentType.CAMERA, source: 'setupCameraSource' }]})
        testee = createTestee({ playoutContentEventEmitter: instance(playoutContentEventEmitter) })
        await testee.updatePlayoutContentState(rundownWithSetupPreviewPlayoutContent)
        // We need to reset the mock so each test has a clean slate.
        resetCalls(playoutContentEventEmitter)
      })

      it('does not emit a ProgramPlayoutContentEvent', async () => {
        const rundownWithoutNextPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ program: [] })
        await testee.updatePlayoutContentState(rundownWithoutNextPlayoutContent)

        verify(playoutContentEventEmitter.emitProgramPlayoutContentEvent(anything())).never()
      })

      describe('it emits a PreviewPlayoutContentEvent', () => {
        describe('next Part has zero Pieces', () => {
          it('emits an empty array of PlayoutContents', async () => {
            const rundownWithoutPreviewPlayoutContent: Rundown = createActiveRundownWithPlayoutContents({ preview: [] })
            await testee.updatePlayoutContentState(rundownWithoutPreviewPlayoutContent)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual([])
          })
        })

        describe('next Part has one Piece', () => {
          it('emits an array of one PlayoutContent', async () => {
            const previewPlayoutContents: PlayoutContent[] = [{ type: PlayoutContentType.REMOTE, source: 'remoteSource' }]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })

        describe('next Part has two Pieces', () => {
          it('emits an array of two PlayoutContents', async () => {
            const previewPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.REMOTE, source: 'remoteSource' },
              { type: PlayoutContentType.MANUS }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })

        describe('next Part has five Pieces', () => {
          it('emits an array of five PlayoutContents', async () => {
            const previewPlayoutContents: PlayoutContent[] = [
              { type: PlayoutContentType.REMOTE, source: 'remoteSource' },
              { type: PlayoutContentType.MANUS },
              { type: PlayoutContentType.COMMAND },
              { type: PlayoutContentType.REPLAY, source: 'replaySource' },
              { type: PlayoutContentType.AUDIO }
            ]
            const rundown: Rundown = createActiveRundownWithPlayoutContents({ preview: previewPlayoutContents })
            await testee.updatePlayoutContentState(rundown)

            const [result] = capture(playoutContentEventEmitter.emitPreviewPlayoutContentEvent).last()
            expect(result).toEqual(previewPlayoutContents)
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  playoutContentEventEmitter?: PlayoutContentEventEmitter,
  playoutContentRepository?: PlayoutContentRepository
}): PlayoutContentUpdateService {
  return new PlayoutContentStateService(
    params?.playoutContentEventEmitter ?? instance(mock<PlayoutContentEventEmitter>()),
    params?.playoutContentRepository ?? instance(mock<PlayoutContentRepository>())
  )
}

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
