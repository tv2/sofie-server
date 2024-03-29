import { TimelineBuilder } from '../interfaces/timeline-builder'
import { SuperflyTimelineBuilder } from '../superfly-timeline-builder'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Part } from '../../../model/entities/part'
import { Rundown } from '../../../model/entities/rundown'
import { Timeline } from '../../../model/entities/timeline'
import { Piece } from '../../../model/entities/piece'
import { LookaheadTimelineObject, TimelineObject, TimelineObjectGroup } from '../../../model/entities/timeline-object'
import { TransitionType } from '../../../model/enums/transition-type'
import { PieceLifespan } from '../../../model/enums/piece-lifespan'
import { ObjectCloner } from '../interfaces/object-cloner'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Studio } from '../../../model/entities/studio'
import { StudioLayer } from '../../../model/value-objects/studio-layer'
import { LookaheadMode } from '../../../model/enums/lookahead-mode'
import { LastPartInRundownException } from '../../../model/exceptions/last-part-in-rundown-exception'

const BASELINE_GROUP_ID: string = 'baseline_group'
const LOOKAHEAD_GROUP_ID: string = 'lookahead_group'
const LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX: string = '_forActive'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const PREVIOUS_GROUP_PREFIX: string = 'previous_group_'
const INFINITE_GROUP_PREFIX: string = 'infinite_group_'
const PIECE_PRE_ROLL_PREFIX: string = 'pre_roll_'

const PIECE_CONTROL_INFIX: string = '_piece_control_'
const PIECE_GROUP_INFIX: string = '_piece_group_'

const HIGH_PRIORITY: number = 5
const MEDIUM_PRIORITY: number = 1
const LOOKAHEAD_PRIORITY: number = 0.1
const BASELINE_PRIORITY: number = 0
const LOW_PRIORITY: number = -1

describe(SuperflyTimelineBuilder.name, () => {
  describe(SuperflyTimelineBuilder.prototype.buildTimeline.name, () => {
    describe('for baseline', () => {
      describe('it creates a group for the baseline', () => {
        it('sets the correct baseline group id', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const baselineGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
            (group) => group.id === BASELINE_GROUP_ID
          )
          expect(baselineGroup).not.toBeUndefined()
        })

        it('sets the enable to while="1"', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
            (group) => group.id === BASELINE_GROUP_ID
          )!
          expect(baselineGroup.enable.while).toBe('1')
        })

        it('sets an empty layer', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
            (group) => group.id === BASELINE_GROUP_ID
          )!
          expect(baselineGroup.layer).toBe('')
        })

        it('sets priority to "baseline" priority', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
            (group) => group.id === BASELINE_GROUP_ID
          )!
          expect(baselineGroup.priority).toBe(BASELINE_PRIORITY)
        })

        it('sets the children to the baseline objects of the Rundown', async () => {
          const baselineTimelineObjects: TimelineObject[] = [
            {id: 'object1'} as TimelineObject,
            {id: 'object2'} as TimelineObject,
            {id: 'object3'} as TimelineObject,
            {id: 'object4'} as TimelineObject,
          ]
          const rundown: Rundown = EntityMockFactory.createActiveRundown({}, {baselineTimelineObjects})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const baselineGroup: TimelineObjectGroup = timeline.timelineGroups.find(
            (group) => group.id === BASELINE_GROUP_ID
          )!
          const timelineObjectIds: string[] = baselineGroup.children.map(
            (timelineObject) => timelineObject.id
          )
          expect(timelineObjectIds).toHaveLength(baselineTimelineObjects.length)
          baselineTimelineObjects.forEach((timelineObject) =>
            expect(timelineObjectIds).toContainEqual(timelineObject.id)
          )
        })
      })
    })

    describe('for active Part', () => {
      describe('it creates a group for active Part', () => {
        it('sets correct active group id for the active Part', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const expectedGroupIdForPart = `${ACTIVE_GROUP_PREFIX}${rundown.getActivePart().id}`
          const result: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
            (group) => group.id === expectedGroupIdForPart
          )

          // If the result is undefined it means the active group Part was not created or created with incorrect id.
          expect(result).not.toBeUndefined()
        })

        it('sets TimelineEnable.start set to be when the active Part was "executed"', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!

          expect(result.enable.start).toBe(rundown.getActivePart().getExecutedAt())
        })

        it('sets an empty layer', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!

          expect(result.layer).toBe('')
        })

        it('sets priority to high', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!

          expect(result.priority).toBe(HIGH_PRIORITY)
        })
      })

      describe('active Part doesn\'t have any Pieces', () => {
        it('don\'t create any children for active Part group', async () => {
          const rundown: Rundown = EntityMockFactory.createActiveRundown()

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!

          expect(result.children).toHaveLength(0)
        })
      })

      describe('active Part has one Piece', () => {
        describe('creates a Piece control group on the active group', () => {
          it('sets correct control group id for Piece on active group', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const expectedControlIdForPiece = `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
            const controlGroup: TimelineObject | undefined = activeGroup.children.find(
              (child) => child.id === expectedControlIdForPiece
            )

            expect(controlGroup).not.toBeUndefined()
          })

          it('sets correct parentGroup id', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const controlObject: TimelineObject = activeGroup.children.find((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )!

            expect(controlObject.inGroup).toBe(activeGroup.id)
          })

          it('sets layer to Piece.layer', async () => {
            const layer: string = 'someLayerForPiece'
            const piece: Piece = EntityMockFactory.createPiece({
              layer,
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const controlObject: TimelineObject = activeGroup.children.find((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )!

            expect(controlObject.layer).toBe(layer)
          })

          it('sets priority to MEDIUM', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const controlObject: TimelineObject = activeGroup.children.find((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )!

            expect(controlObject.priority).toBe(MEDIUM_PRIORITY)
          })

          describe('creates TimelineEnable for IN_TRANSITION Piece', () => {
            describe('active Part has an "inTransitionStart"', () => {
              it('sets TimelineEnable.start to Part.timings.inTransitionStart + Piece.start', async () => {
                const inTransitionStart: number = 20
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 10,
                  transitionType: TransitionType.IN_TRANSITION,
                })

                const activePart: Part = EntityMockFactory.createPart(
                  {pieces: [piece]},
                  {partTimings: {inTransitionStart}}
                )
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.start).toBe(inTransitionStart + piece.getStart())
              })

              it('sets TimelineEnable.duration to Piece.duration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  duration: 15,
                  transitionType: TransitionType.IN_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart(
                  {pieces: [piece]},
                  {partTimings: {inTransitionStart: 20}}
                )
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.duration).toBe(piece.getDuration())
              })
            })

            describe('active Part does not have an "inTransitionStart"', () => {
              it('does not create any groups for Piece', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.IN_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const expectedControlIdForPiece = `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
                const controlObject: TimelineObject | undefined = activeGroup.children.find(
                  (child) => child.id === expectedControlIdForPiece
                )

                expect(controlObject).toBeUndefined()
              })
            })
          })

          describe('creates TimelineEnable for OUT_TRANSITION Piece', () => {
            describe('active Part has a "KeepAliveDuration"', () => {
              describe('active Part has a PostRollDuration', () => {
                it('sets TimelineEnable.start to activeGroup.end - Part.keepAliveDuration - Part.postRollDuration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.OUT_TRANSITION,
                  })

                  const postRollDuration: number = 20
                  const keepAliveDuration: number = 30

                  const activePart: Part = EntityMockFactory.createPart(
                    {
                      outTransition: {keepAliveDuration},
                      pieces: [piece],
                    },
                    {partTimings: {postRollDuration}}
                  )
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(ACTIVE_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = activeGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlObject.enable.start).toBe(
                    `#${activeGroup.id}.end - ${keepAliveDuration} - ${postRollDuration}`
                  )
                })
              })

              describe('active Part does not have a PostRollDuration', () => {
                it('sets TimelineEnable.start to activeGroup.end - Part.keepAliveDuration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.OUT_TRANSITION,
                  })

                  const keepAliveDuration: number = 30

                  const activePart: Part = EntityMockFactory.createPart({
                    outTransition: {keepAliveDuration},
                    pieces: [piece],
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(ACTIVE_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = activeGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlObject.enable.start).toBe(
                    `#${activeGroup.id}.end - ${keepAliveDuration}`
                  )
                })
              })
            })

            describe('active Part does not have a "KeepAliveDuration"', () => {
              it('does not create any groups for Piece', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.OUT_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject | undefined = activeGroup.children.find(
                  (child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
                )

                expect(controlObject).toBeUndefined()
              })
            })
          })

          describe('creates TimelineEnable for NO_TRANSITION Piece', () => {
            it('sets TimelineEnable.start to Piece.start', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                start: 5,
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const controlObject: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!

              expect(controlObject.enable.start).toBe(piece.getStart())
            })

            describe('active Part has a delayStartOfPiecesDuration', () => {
              it('sets the TimelineEnable.start for planned piece to Piece.start + delayStartOfPiecesDuration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.NO_TRANSITION,
                  isPlanned: true,
                  start: 10,
                })
                const activePart: Part = EntityMockFactory.createPart(
                  {pieces: [piece]},
                  {partTimings: {delayStartOfPiecesDuration: 50}}
                )
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.start).toBe(
                  piece.getStart() + activePart.getTimings().delayStartOfPiecesDuration
                )
              })

              it('sets the TimelineEnable.start for unplanned piece to Piece.start', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.NO_TRANSITION,
                  isPlanned: false,
                  start: 10,
                })
                const activePart: Part = EntityMockFactory.createPart(
                  {pieces: [piece]},
                  {partTimings: {delayStartOfPiecesDuration: 50}}
                )
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.start).toBe(piece.getStart())
              })

            })

            describe('Piece has a duration', () => {
              it('sets TimelineEnable.duration to Piece.duration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  duration: 50,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.duration).toBe(piece.getDuration())
              })
            })

            describe('Piece does not have a duration', () => {
              describe('active Part has PostRoll', () => {
                it('sets TimelineEnable.duration activeGroup.end - Part.timings.postRollDuration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.NO_TRANSITION,
                  })

                  const postRollDuration: number = 20

                  const activePart: Part = EntityMockFactory.createPart(
                    {pieces: [piece]},
                    {partTimings: {postRollDuration}}
                  )
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(ACTIVE_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = activeGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlObject.enable.duration).toBe(
                    `#${activeGroup.id} - ${postRollDuration}`
                  )
                })
              })

              describe('active Part does not have PostRoll', () => {
                it('sets TimelineEnable.duration to be undefined', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const activePart: Part = EntityMockFactory.createPart({
                    pieces: [piece],
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(ACTIVE_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = activeGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlObject.enable.duration).toBe(undefined)
                })
              })
            })
          })

          describe('controlGroup has TimelineEnable.start === zero && Piece has PreRoll', () => {
            describe('creates PreRollControlGroup for Piece', () => {
              it('sets id to correct id for PreRollControlGroup', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 0,
                  preRollDuration: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find(
                  (child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
                )!
                const expectedPreRollIdForPiece: string = `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`
                const preRollObject: TimelineObject | undefined = activeGroup.children.find(
                  (child) => child.id === expectedPreRollIdForPiece
                )

                expect(preRollObject).not.toBeUndefined()
              })

              it('sets TimelineEnable.start to "activeGroup.id.start"', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 0,
                  preRollDuration: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const preRollObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_PRE_ROLL_PREFIX)
                )!

                expect(preRollObject.enable.start).toBe(`#${activeGroup.id}.start`)
              })

              it('sets an empty layer', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 0,
                  preRollDuration: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const preRollObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_PRE_ROLL_PREFIX)
                )!

                expect(preRollObject.layer).toBe('')
              })

              it('updates controlPiece to start at PreRollControlGroup + Piece.preRollDuration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 0,
                  preRollDuration: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const activePart: Part = EntityMockFactory.createPart({
                  pieces: [piece],
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(ACTIVE_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!
                const preRollObject: TimelineObject = activeGroup.children.find((child) =>
                  child.id.includes(PIECE_PRE_ROLL_PREFIX)
                )!

                expect(controlObject.enable.start).toBe(
                  `#${preRollObject.id} + ${piece.preRollDuration}`
                )
              })
            })
          })
        })

        describe('create a Piece child group on the active group', () => {
          it('sets correct Piece group id for Piece on active group', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const expectedChildGroupIdForPiece: string = `${activeGroup.id}${PIECE_GROUP_INFIX}${piece.id}`
            const childGroup: TimelineObject | undefined = activeGroup.children.find(
              (child) => child.id === expectedChildGroupIdForPiece
            )

            expect(childGroup).not.toBeUndefined()
          })

          it('sets correct parentGroup id', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const childGroup: TimelineObject = activeGroup.children.find((child) =>
              child.id.includes(PIECE_GROUP_INFIX)
            )!

            expect(childGroup.inGroup).toBe(activeGroup.id)
          })

          it('sets an empty layer', async () => {
            const piece: Piece = EntityMockFactory.createPiece({
              transitionType: TransitionType.NO_TRANSITION,
            })
            const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const childGroup: TimelineObject = activeGroup.children.find((child) =>
              child.id.includes(PIECE_GROUP_INFIX)
            )!

            expect(childGroup.layer).toBe('')
          })

          describe('Piece has PreRoll', () => {
            it('sets TimelineEnable.start PieceControlGroup.start - Piece.preRollDuration', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                preRollDuration: 20,
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const controlObject: TimelineObject = activeGroup.children.find(
                (child) => child.id === `${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
              )!
              const childGroup: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.enable.start).toBe(
                `#${controlObject.id}.start - ${piece.preRollDuration}`
              )
            })
          })

          describe('Piece does not have PreRoll', () => {
            it('sets TimelineEnable.start to PieceControlGroup.start', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const controlObject: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!
              const childGroup: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.enable.start).toBe(`#${controlObject.id}.start`)
            })
          })

          describe('Piece has PostRoll', () => {
            it('sets TimelineEnable.end to PieceControlGroup.end - Piece.postRollDuration', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                postRollDuration: 30,
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const controlObject: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!
              const childGroup: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.enable.end).toBe(`#${controlObject.id}.end - ${piece.postRollDuration}`)
            })
          })

          describe('Piece does not have PostRoll', () => {
            it('sets TimelineEnable.end to PieceControlGroup.end', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const controlObject: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!
              const childGroup: TimelineObject = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.enable.end).toBe(`#${controlObject.id}.end`)
            })
          })

          describe('Piece has a TimelineObject', () => {
            it('sets the id of the TimelineObject to be pieceChildGroup.id_piece.id_timelineObject.id', async () => {
              const timelineObject: TimelineObject = {id: 'timelineObjectId'} as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [timelineObject],
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )! as TimelineObjectGroup
              const result: TimelineObject = childGroup.children[0]

              expect(result.id).toBe(`${childGroup.id}_${piece.id}_${timelineObject.id}`)
            })

            it('sets the group of the TimelineObject to be the Piece child group', async () => {
              const timelineObject: TimelineObject = {id: 'timelineObjectId'} as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [timelineObject],
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )! as TimelineObjectGroup
              const result: TimelineObject = childGroup.children[0]

              expect(result.inGroup).toBe(childGroup.id)
            })

            it('has same content as the TimelineObject', async () => {
              const content: unknown = {someContent: 'someContent'}
              const timelineObject: TimelineObject = {id: 'timelineObjectId', content} as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [timelineObject],
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const objectCloner: ObjectCloner = mock<ObjectCloner>()
              when(objectCloner.clone(timelineObject)).thenReturn(
                JSON.parse(JSON.stringify(timelineObject))
              )

              const testee: TimelineBuilder = createTestee(instance(objectCloner))
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )! as TimelineObjectGroup
              const result: TimelineObject = childGroup.children[0]

              expect(result.content).toEqual(content)
            })
          })

          describe('Piece has five TimelineObjects', () => {
            it('adds all five TimelineObjects to the children of the Piece child group', async () => {
              const timelineObjects: TimelineObject[] = [
                {id: '1'} as TimelineObject,
                {id: '2'} as TimelineObject,
                {id: '3'} as TimelineObject,
                {id: '4'} as TimelineObject,
                {id: '5'} as TimelineObject,
              ]
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects,
                transitionType: TransitionType.NO_TRANSITION,
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

              const objectCloner: ObjectCloner = mock<ObjectCloner>()
              timelineObjects.forEach((timelineObject) =>
                when(objectCloner.clone(timelineObject)).thenReturn(
                  JSON.parse(JSON.stringify(timelineObject))
                )
              )

              const testee: TimelineBuilder = createTestee(instance(objectCloner))
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(ACTIVE_GROUP_PREFIX)
              )!
              const childGroup: TimelineObjectGroup = activeGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )! as TimelineObjectGroup

              const timelineObjectIds: string[] = childGroup.children.map(
                (timelineObject) => timelineObject.id
              )
              timelineObjects.forEach((timelineObject) =>
                expect(timelineObjectIds).toContainEqual(
                  `${childGroup.id}_${piece.id}_${timelineObject.id}`
                )
              )
            })
          })
        })
      })

      describe('active Part has five Pieces', () => {
        it('creates five Piece control groups on the active group', async () => {
          const pieces: Piece[] = [
            EntityMockFactory.createPiece({
              id: '1',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '2',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '3',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '4',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '5',
              transitionType: TransitionType.NO_TRANSITION,
            }),
          ]
          const activePart: Part = EntityMockFactory.createPart({pieces})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!
          const controlGroups: TimelineObject[] = activeGroup.children.filter((child) =>
            child.id.includes(PIECE_CONTROL_INFIX)
          )
          const controlGroupIds: string[] = controlGroups.map((controlGroup) => controlGroup.id)
          pieces.forEach((piece) =>
            expect(controlGroupIds).toContainEqual(`${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`)
          )
        })

        it('creates five Piece child groups on the active group', async () => {
          const pieces: Piece[] = [
            EntityMockFactory.createPiece({
              id: '1',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '2',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '3',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '4',
              transitionType: TransitionType.NO_TRANSITION,
            }),
            EntityMockFactory.createPiece({
              id: '5',
              transitionType: TransitionType.NO_TRANSITION,
            }),
          ]
          const activePart: Part = EntityMockFactory.createPart({pieces})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(ACTIVE_GROUP_PREFIX)
          )!
          const childGroups: TimelineObject[] = activeGroup.children.filter((child) =>
            child.id.includes(PIECE_GROUP_INFIX)
          )
          const childGroupIds: string[] = childGroups.map((controlGroup) => controlGroup.id)
          pieces.forEach((piece) =>
            expect(childGroupIds).toContainEqual(`${activeGroup.id}${PIECE_GROUP_INFIX}${piece.id}`)
          )
        })

        describe('four of the Pieces are infinite Pieces', () => {
          it('still creates groups for five Pieces', async () => {
            const pieces: Piece[] = [
              EntityMockFactory.createPiece({
                id: '1',
                pieceLifespan: PieceLifespan.WITHIN_PART,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                id: '2',
                pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                id: '3',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                id: '4',
                pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                id: '5',
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
                transitionType: TransitionType.NO_TRANSITION,
              }),
            ]
            const activePart: Part = EntityMockFactory.createPart({pieces})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!
            const controlGroups: TimelineObject[] = activeGroup.children.filter((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )
            const controlGroupIds: string[] = controlGroups.map((controlGroup) => controlGroup.id)
            pieces.forEach((piece) =>
              expect(controlGroupIds).toContainEqual(`${activeGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`)
            )
          })
        })
      })
    })

    describe('Rundown has a previous Part', () => {
      describe('previous Part does not have an executedAt', () => {
        it('throws an error', async () => {
          const previousPart: Part = EntityMockFactory.createPart({id: 'previousId'})
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()

          await expect(() => testee.buildTimeline(rundown, createBasicStudioMock())).rejects.toThrow()
        })
      })

      describe('it creates a group for previous Part', () => {
        it('sets correct previous group id for the previous Part', async () => {
          const previousPart: Part = EntityMockFactory.createPart(
            {id: 'previousId'},
            {
              executedAt: 10,
            }
          )
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const expectedGroupIdForPart: string = `${PREVIOUS_GROUP_PREFIX}${previousPart.id}`
          const result: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
            (group) => group.id === expectedGroupIdForPart
          )

          expect(result).not.toBeUndefined()
        })

        it('sets priority of the group to low', async () => {
          const previousPart: Part = EntityMockFactory.createPart(
            {id: 'previousId'},
            {
              executedAt: 10,
            }
          )
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(PREVIOUS_GROUP_PREFIX)
          )!

          expect(result.priority).toBe(LOW_PRIORITY)
        })

        it('sets an empty layer', async () => {
          const previousPart: Part = EntityMockFactory.createPart(
            {id: 'previousId'},
            {
              executedAt: 10,
            }
          )
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(PREVIOUS_GROUP_PREFIX)
          )!

          expect(result.layer).toBe('')
        })

        it('sets the TimelineEnable.start to be when the previous Part was executed', async () => {
          const previousPart: Part = EntityMockFactory.createPart(
            {id: 'previousId'},
            {
              executedAt: 10,
            }
          )
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(PREVIOUS_GROUP_PREFIX)
          )!

          expect(result.enable.start).toBe(previousPart.getExecutedAt())
        })

        describe('active Part has a "previousPartContinueIntoPartDuration"', () => {
          it('sets the TimelineEnable.end to activeGroup.start + active Part.previousPartContinueIntoPartDuration', async () => {
            const previousPartContinueIntoPartDuration: number = 50

            const previousPart: Part = EntityMockFactory.createPart(
              {id: 'previousId'},
              {
                executedAt: 10,
              }
            )
            const activePart: Part = EntityMockFactory.createPart(
              {id: 'activeId'},
              {
                partTimings: {previousPartContinueIntoPartDuration},
              }
            )
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroupId: string = `${ACTIVE_GROUP_PREFIX}${activePart.id}`
            const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(PREVIOUS_GROUP_PREFIX)
            )!

            expect(result.enable.end).toBe(
              `#${activeGroupId}.start + ${previousPartContinueIntoPartDuration}`
            )
          })
        })

        describe('active Part does not have a "previousPartContinueIntoPartDuration"', () => {
          it('sets the TimelineEnable.end to activeGroup.start + 0', async () => {
            const previousPart: Part = EntityMockFactory.createPart(
              {id: 'previousId'},
              {
                executedAt: 10,
              }
            )
            const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroupId: string = `${ACTIVE_GROUP_PREFIX}${activePart.id}`
            const result: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(PREVIOUS_GROUP_PREFIX)
            )!

            expect(result.enable.end).toBe(`#${activeGroupId}.start + 0`)
          })
        })

        describe('previous Part has a Piece', () => {
          describe('creates a Piece control group on the previous group', () => {
            it('sets correct control group id for Piece on previous group', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const expectedControlIdForPiece = `${previousGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`
              const controlGroup: TimelineObject | undefined = previousGroup.children.find(
                (child) => child.id === expectedControlIdForPiece
              )

              expect(controlGroup).not.toBeUndefined()
            })

            it('sets correct parentGroup id', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!

              expect(controlGroup.inGroup).toBe(previousGroup.id)
            })

            it('sets layer to Piece.layer', async () => {
              const layer: string = 'someLayerForPiece'
              const piece: Piece = EntityMockFactory.createPiece({
                layer,
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!

              expect(controlGroup.layer).toBe(layer)
            })

            it('sets priority to MEDIUM', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                child.id.includes(PIECE_CONTROL_INFIX)
              )!

              expect(controlGroup.priority).toBe(MEDIUM_PRIORITY)
            })

            describe('creates TimelineEnable for IN_TRANSITION Piece', () => {
              describe('previous Part has an "inTransitionStart"', () => {
                it('sets TimelineEnable.start to Part.timings.inTransitionStart + Piece.start', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    start: 10,
                    transitionType: TransitionType.IN_TRANSITION,
                  })
                  const inTransitionStart: number = 20
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {
                      partTimings: {inTransitionStart},
                      executedAt: 10,
                      piecesWithLifespanFilters: [piece],
                    }
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlGroup.enable.start).toBe(inTransitionStart + piece.getStart())
                })

                it('sets TimelineEnable.duration to Piece.duration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    duration: 15,
                    transitionType: TransitionType.IN_TRANSITION,
                  })
                  const inTransitionStart: number = 20
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {
                      partTimings: {inTransitionStart},
                      executedAt: 10,
                      piecesWithLifespanFilters: [piece],
                    }
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlGroup.enable.duration).toBe(piece.getDuration())
                })
              })

              describe('previous Part does not have an "inTransitionStart"', () => {
                it('does not create any groups for Piece', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.IN_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlGroup: TimelineObject | undefined = previousGroup.children.find(
                    (child) => child.id.includes(PIECE_CONTROL_INFIX)
                  )

                  expect(controlGroup).toBeUndefined()
                })
              })
            })

            describe('creates TimelineEnable for OUT_TRANSITION Piece', () => {
              describe('previous Part has a "KeepAliveDuration"', () => {
                describe('previous Part has a PostRollDuration', () => {
                  it('sets TimelineEnable.start to previousGroup.end - Part.keepAliveDuration - previous Part.postRoll', async () => {
                    const postRollDuration: number = 20
                    const keepAliveDuration: number = 30

                    const piece: Piece = EntityMockFactory.createPiece({
                      transitionType: TransitionType.OUT_TRANSITION,
                    })
                    const previousPart: Part = EntityMockFactory.createPart(
                      {
                        id: 'previousId',
                        outTransition: {keepAliveDuration},
                        pieces: [piece],
                      },
                      {
                        partTimings: {postRollDuration},
                        executedAt: 10,
                        piecesWithLifespanFilters: [piece],
                      }
                    )
                    const activePart: Part = EntityMockFactory.createPart({
                      id: 'activeId',
                    })
                    const rundown: Rundown = EntityMockFactory.createActiveRundown({
                      activePart,
                      previousPart,
                    })

                    const testee: TimelineBuilder = createTestee()
                    const timeline: Timeline = await testee.buildTimeline(
                      rundown,
                      createBasicStudioMock()
                    )

                    const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                      (group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
                    )!
                    const controlObject: TimelineObject = previousGroup.children.find((child) =>
                      child.id.includes(PIECE_CONTROL_INFIX)
                    )!

                    expect(controlObject.enable.start).toBe(
                      `#${previousGroup.id}.end - ${keepAliveDuration} - ${postRollDuration}`
                    )
                  })
                })

                describe('previous Part does not have a PostRollDuration', () => {
                  it('sets TimelineEnable.start to previousGroup.end - previous Part.keepAliveDuration', async () => {
                    const keepAliveDuration: number = 30

                    const piece: Piece = EntityMockFactory.createPiece({
                      transitionType: TransitionType.OUT_TRANSITION,
                    })
                    const previousPart: Part = EntityMockFactory.createPart(
                      {
                        id: 'previousId',
                        outTransition: {keepAliveDuration},
                        pieces: [piece],
                      },
                      {executedAt: 10, piecesWithLifespanFilters: [piece]}
                    )
                    const activePart: Part = EntityMockFactory.createPart({
                      id: 'activeId',
                    })
                    const rundown: Rundown = EntityMockFactory.createActiveRundown({
                      activePart,
                      previousPart,
                    })

                    const testee: TimelineBuilder = createTestee()
                    const timeline: Timeline = await testee.buildTimeline(
                      rundown,
                      createBasicStudioMock()
                    )

                    const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                      (group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
                    )!
                    const controlObject: TimelineObject = previousGroup.children.find((child) =>
                      child.id.includes(PIECE_CONTROL_INFIX)
                    )!

                    expect(controlObject.enable.start).toBe(
                      `#${previousGroup.id}.end - ${keepAliveDuration}`
                    )
                  })
                })
              })

              describe('previous Part does not have a "KeepAliveDuration"', () => {
                it('does not create any groups for Piece', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    transitionType: TransitionType.OUT_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject | undefined = previousGroup.children.find(
                    (child) => child.id.includes(PIECE_CONTROL_INFIX)
                  )

                  expect(controlObject).toBeUndefined()
                })
              })
            })

            describe('creates TimelineEnable for NO_TRANSITION Piece', () => {
              it('sets TimelineEnable.start to Piece.start', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  start: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const controlObject: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!

                expect(controlObject.enable.start).toBe(piece.getStart())
              })

              describe('Piece has a duration', () => {
                it('sets TimelineEnable.duration to Piece.duration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    duration: 15,
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!

                  expect(controlObject.enable.duration).toBe(piece.getDuration())
                })
              })

              describe('Piece does not have a duration', () => {
                describe('previous Part has PostRoll', () => {
                  it('sets TimelineEnable.duration to previousGroup - Part.timings.postRollDuration', async () => {
                    const postRollDuration: number = 30

                    const piece: Piece = EntityMockFactory.createPiece({
                      transitionType: TransitionType.NO_TRANSITION,
                    })
                    const previousPart: Part = EntityMockFactory.createPart(
                      {id: 'previousId', pieces: [piece]},
                      {
                        partTimings: {postRollDuration},
                        executedAt: 10,
                        piecesWithLifespanFilters: [piece],
                      }
                    )
                    const activePart: Part = EntityMockFactory.createPart({
                      id: 'activeId',
                    })
                    const rundown: Rundown = EntityMockFactory.createActiveRundown({
                      activePart,
                      previousPart,
                    })

                    const testee: TimelineBuilder = createTestee()
                    const timeline: Timeline = await testee.buildTimeline(
                      rundown,
                      createBasicStudioMock()
                    )

                    const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                      (group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
                    )!
                    const controlObject: TimelineObject = previousGroup.children.find((child) =>
                      child.id.includes(PIECE_CONTROL_INFIX)
                    )!

                    expect(controlObject.enable.duration).toBe(
                      `#${previousGroup.id} - ${postRollDuration}`
                    )
                  })
                })

                describe('previous Part does not have PostRoll', () => {
                  it('sets TimelineEnable.duration to undefined', async () => {
                    const piece: Piece = EntityMockFactory.createPiece({
                      transitionType: TransitionType.NO_TRANSITION,
                    })
                    const previousPart: Part = EntityMockFactory.createPart(
                      {id: 'previousId', pieces: [piece]},
                      {executedAt: 10, piecesWithLifespanFilters: [piece]}
                    )
                    const activePart: Part = EntityMockFactory.createPart({
                      id: 'activeId',
                    })
                    const rundown: Rundown = EntityMockFactory.createActiveRundown({
                      activePart,
                      previousPart,
                    })

                    const testee: TimelineBuilder = createTestee()
                    const timeline: Timeline = await testee.buildTimeline(
                      rundown,
                      createBasicStudioMock()
                    )

                    const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                      (group) => group.id.includes(PREVIOUS_GROUP_PREFIX)
                    )!
                    const controlObject: TimelineObject = previousGroup.children.find((child) =>
                      child.id.includes(PIECE_CONTROL_INFIX)
                    )!

                    expect(controlObject.enable.duration).toBe(undefined)
                  })
                })
              })
            })

            describe('controlGroup has TimelineEnable.start === zero && Piece has PreRoll', () => {
              describe('creates PreRollControlGroup for Piece', () => {
                it('sets id to correct id for PreRollControlGroup', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    start: 0,
                    preRollDuration: 10,
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!
                  const expectedPreRollIdForPiece: string = `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`
                  const preRollObject: TimelineObject | undefined = previousGroup.children.find(
                    (child) => child.id === expectedPreRollIdForPiece
                  )

                  expect(preRollObject).not.toBeUndefined()
                })

                it('sets TimelineEnable.start to "previousGroup.id.start"', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    start: 0,
                    preRollDuration: 10,
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const preRollObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_PRE_ROLL_PREFIX)
                  )!

                  expect(preRollObject.enable.start).toBe(`#${previousGroup.id}.start`)
                })

                it('sets an empty layer', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    start: 0,
                    preRollDuration: 10,
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const preRollObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_PRE_ROLL_PREFIX)
                  )!

                  expect(preRollObject.layer).toBe('')
                })

                it('updates controlPiece to start at PreRollControlGroup + Piece.preRollDuration', async () => {
                  const piece: Piece = EntityMockFactory.createPiece({
                    start: 0,
                    preRollDuration: 10,
                    transitionType: TransitionType.NO_TRANSITION,
                  })
                  const previousPart: Part = EntityMockFactory.createPart(
                    {id: 'previousId', pieces: [piece]},
                    {executedAt: 10, piecesWithLifespanFilters: [piece]}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    previousPart,
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(PREVIOUS_GROUP_PREFIX)
                  )!
                  const controlObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_CONTROL_INFIX)
                  )!
                  const preRollObject: TimelineObject = previousGroup.children.find((child) =>
                    child.id.includes(PIECE_PRE_ROLL_PREFIX)
                  )!

                  expect(controlObject.enable.start).toBe(
                    `#${preRollObject.id} + ${piece.preRollDuration}`
                  )
                })
              })
            })
          })

          describe('create a Piece child group on the previous group', () => {
            it('sets correct Piece group id for Piece on previous group', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const expectedChildGroupIdForPiece: string = `${previousGroup.id}${PIECE_GROUP_INFIX}${piece.id}`
              const childGroup: TimelineObject | undefined = previousGroup.children.find(
                (child) => child.id === expectedChildGroupIdForPiece
              )

              expect(childGroup).not.toBeUndefined()
            })

            it('sets correct parentGroup id', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const childGroup: TimelineObject = previousGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.inGroup).toBe(previousGroup.id)
            })

            it('sets an empty layer', async () => {
              const piece: Piece = EntityMockFactory.createPiece({
                transitionType: TransitionType.NO_TRANSITION,
              })
              const previousPart: Part = EntityMockFactory.createPart(
                {id: 'previousId', pieces: [piece]},
                {executedAt: 10, piecesWithLifespanFilters: [piece]}
              )
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

              const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                group.id.includes(PREVIOUS_GROUP_PREFIX)
              )!
              const childGroup: TimelineObject = previousGroup.children.find((child) =>
                child.id.includes(PIECE_GROUP_INFIX)
              )!

              expect(childGroup.layer).toBe('')
            })

            describe('Piece has PreRoll', () => {
              it('sets TimelineEnable.start PieceControlGroup.start - Piece.preRollDuration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  preRollDuration: 10,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!
                const childGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )!

                expect(childGroup.enable.start).toBe(
                  `#${controlGroup.id}.start - ${piece.preRollDuration}`
                )
              })
            })

            describe('Piece does not have PreRoll', () => {
              it('sets TimelineEnable.start to PieceControlGroup.start - 0', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!
                const childGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )!

                expect(childGroup.enable.start).toBe(`#${controlGroup.id}.start`)
              })
            })

            describe('Piece has PostRoll', () => {
              it('sets TimelineEnable.end to PieceControlGroup.end - Piece.postRollDuration', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  postRollDuration: 30,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!
                const childGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )!

                expect(childGroup.enable.end).toBe(
                  `#${controlGroup.id}.end - ${piece.postRollDuration}`
                )
              })
            })

            describe('Piece does not have PostRoll', () => {
              it('sets TimelineEnable.end to PieceControlGroup.end', async () => {
                const piece: Piece = EntityMockFactory.createPiece({
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const controlGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_CONTROL_INFIX)
                )!
                const childGroup: TimelineObject = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )!

                expect(childGroup.enable.end).toBe(`#${controlGroup.id}.end`)
              })
            })

            describe('Piece has a TimelineObject', () => {
              it('sets the id of the TimelineObject to be pieceChildGroup.id_piece.id_timelineObject.id', async () => {
                const timelineObject: TimelineObject = {id: 'timelineObjectId'} as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )! as TimelineObjectGroup
                const result: TimelineObject = childGroup.children[0]

                expect(result.id).toBe(`${childGroup.id}_${piece.id}_${timelineObject.id}`)
              })

              it('sets the group of the TimelineObject to be the Piece child group', async () => {
                const timelineObject: TimelineObject = {id: 'timelineObjectId'} as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )! as TimelineObjectGroup
                const result: TimelineObject = childGroup.children[0]

                expect(result.inGroup).toBe(childGroup.id)
              })

              it('has same content as the TimelineObject', async () => {
                const content: unknown = {someContent: 'someContent'}
                const timelineObject: TimelineObject = {
                  id: 'timelineObjectId',
                  content,
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const objectCloner: ObjectCloner = mock<ObjectCloner>()
                when(objectCloner.clone(timelineObject)).thenReturn(
                  JSON.parse(JSON.stringify(timelineObject))
                )

                const testee: TimelineBuilder = createTestee(instance(objectCloner))
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )! as TimelineObjectGroup
                const result: TimelineObject = childGroup.children[0]

                expect(result.content).toEqual(content)
              })
            })

            describe('Piece has five TimelineObjects', () => {
              it('adds all five TimelineObjects to the children of the Piece child group', async () => {
                const timelineObjects: TimelineObject[] = [
                  {id: '1'} as TimelineObject,
                  {id: '2'} as TimelineObject,
                  {id: '3'} as TimelineObject,
                  {id: '4'} as TimelineObject,
                  {id: '5'} as TimelineObject,
                ]
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects,
                  transitionType: TransitionType.NO_TRANSITION,
                })
                const previousPart: Part = EntityMockFactory.createPart(
                  {id: 'previousId', pieces: [piece]},
                  {executedAt: 10, piecesWithLifespanFilters: [piece]}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  previousPart,
                })

                const objectCloner: ObjectCloner = mock<ObjectCloner>()
                timelineObjects.forEach((timelineObject) =>
                  when(objectCloner.clone(timelineObject)).thenReturn(
                    JSON.parse(JSON.stringify(timelineObject))
                  )
                )

                const testee: TimelineBuilder = createTestee(instance(objectCloner))
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(PREVIOUS_GROUP_PREFIX)
                )!
                const childGroup: TimelineObjectGroup = previousGroup.children.find((child) =>
                  child.id.includes(PIECE_GROUP_INFIX)
                )! as TimelineObjectGroup

                const timelineObjectIds: string[] = childGroup.children.map(
                  (timelineObject) => timelineObject.id
                )
                timelineObjects.forEach((timelineObject) =>
                  expect(timelineObjectIds).toContainEqual(
                    `${childGroup.id}_${piece.id}_${timelineObject.id}`
                  )
                )
              })
            })
          })
        })
      })

      describe('previous Part does not have any Pieces', () => {
        it('does not create any groups for the Pieces', async () => {
          const previousPart: Part = EntityMockFactory.createPart(
            {id: 'previousId'},
            {
              executedAt: 10,
            }
          )
          const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
            group.id.includes(PREVIOUS_GROUP_PREFIX)
          )!
          const controlGroup: TimelineObject | undefined = previousGroup.children.find((child) =>
            child.id.includes(PIECE_CONTROL_INFIX)
          )

          expect(controlGroup).toBeUndefined()
        })
      })

      describe('previous Part has Pieces', () => {
        describe('previous Part has five Pieces, but one of them is an infinite Piece', () => {
          it('only creates groups for four Pieces', async () => {
            const infinitePiece: Piece = EntityMockFactory.createPiece({
              pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
              transitionType: TransitionType.NO_TRANSITION,
            })
            const nonInfinitePieces: Piece[] = [
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.WITHIN_PART,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.WITHIN_PART,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.WITHIN_PART,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.WITHIN_PART,
                transitionType: TransitionType.NO_TRANSITION,
              }),
            ]
            const previousPart: Part = EntityMockFactory.createPart(
              {id: 'previousId', pieces: [infinitePiece, ...nonInfinitePieces]},
              {executedAt: 10, piecesWithLifespanFilters: nonInfinitePieces}
            )
            const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(PREVIOUS_GROUP_PREFIX)
            )!
            const controlGroups: TimelineObject[] = previousGroup.children.filter((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )

            expect(controlGroups).toHaveLength(4)
          })
        })

        describe('previous Part has five Pieces, but all of them are infinite Pieces', () => {
          it('does not create any groups for the Pieces', async () => {
            const infinitePieces: Piece[] = [
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.STICKY_UNTIL_SEGMENT_CHANGE,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_SEGMENT_END,
                transitionType: TransitionType.NO_TRANSITION,
              }),
              EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                transitionType: TransitionType.NO_TRANSITION,
              }),
            ]
            const previousPart: Part = EntityMockFactory.createPart(
              {id: 'previousId', pieces: infinitePieces},
              {executedAt: 10}
            )
            const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const previousGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(PREVIOUS_GROUP_PREFIX)
            )!
            const controlGroups: TimelineObject[] = previousGroup.children.filter((child) =>
              child.id.includes(PIECE_CONTROL_INFIX)
            )

            expect(controlGroups).toHaveLength(0)
          })
        })
      })
    })

    describe('Rundown does not have a previous Part', () => {
      it('does not create a group for previous Part', async () => {
        const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
        const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, previousPart: undefined})

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const previousGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
          group.id.includes(PREVIOUS_GROUP_PREFIX)
        )

        expect(previousGroup).toBeUndefined()
      })
    })

    describe('active Part has autoNext', () => {
      describe('active Part has an expected duration longer than zero', () => {
        describe('active Part has "delayStartOfPiecesDuration', () => {
          it('sets TimelineEnable.duration of the active group to active Part.expectedDuration + active Part.timings.delayStartOfPiecesDuration', async () => {
            const delayStartOfPiecesDuration: number = 5

            const nextPart: Part = EntityMockFactory.createPart({id: 'nextId'})
            const activePart: Part = EntityMockFactory.createPart(
              {id: 'activeId', expectedDuration: 15, autoNext: {overlap: 0}},
              {partTimings: {delayStartOfPiecesDuration}}
            )
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!

            const expectedDurationOfActivePart: number = activePart.expectedDuration ?? 0
            expect(activeGroup.enable.duration).toBe(
              expectedDurationOfActivePart + delayStartOfPiecesDuration
            )
          })
        })

        describe('active Part does not have "delayStartOfPiecesDuration', () => {
          it('sets TimelineEnable.duration of the active group to active Part.expectedDuration', async () => {
            const nextPart: Part = EntityMockFactory.createPart({id: 'nextId'})
            const activePart: Part = EntityMockFactory.createPart({
              id: 'activeId',
              expectedDuration: 15,
              autoNext: {overlap: 0},
            })
            const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const activeGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
              group.id.includes(ACTIVE_GROUP_PREFIX)
            )!

            expect(activeGroup.enable.duration).toBe(activePart.expectedDuration)
          })
        })

        it('sets Timeline.autoNext.epochTimeToTakeNext to be active Part.executedAt + active Part.expected duration + active Part.delayStartOffPiecesDuration - next Part.previousPartContinueIntoPartDuration', async () => {
          const delayStartOfPiecesDuration: number = 30
          const continueIntoPartDuration: number = 50

          const nextPart: Part = EntityMockFactory.createPart(
            {id: 'nextId'},
            {
              partTimings: {previousPartContinueIntoPartDuration: continueIntoPartDuration},
            }
          )
          const activePart: Part = EntityMockFactory.createPart(
            {id: 'activeId', expectedDuration: 15, autoNext: {overlap: 0}},
            {partTimings: {delayStartOfPiecesDuration}}
          )
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          expect(timeline.autoNext).not.toBeUndefined()
          const expectedDurationOfActivePart: number = activePart.expectedDuration ?? 0
          const expectedEpochTimeToTakeNext: number =
            activePart.getExecutedAt() + expectedDurationOfActivePart + delayStartOfPiecesDuration - continueIntoPartDuration
          expect(timeline.autoNext?.epochTimeToTakeNext).toBe(expectedEpochTimeToTakeNext)
        })
      })

      describe('active Part does not have an expected duration longer than zero', () => {
        it('does not set Timeline.autoNext', async () => {
          const nextPart: Part = EntityMockFactory.createPart({id: 'nextId'})
          const activePart: Part = EntityMockFactory.createPart({
            id: 'activeId',
            autoNext: {overlap: 0},
          })
          const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          expect(timeline.autoNext).toBeUndefined()
        })
      })
    })

    describe('active Part does not have autoNext', () => {
      it('does not set Timeline.autoNext', async () => {
        const nextPart: Part = EntityMockFactory.createPart({id: 'nextId'})
        const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
        const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        expect(timeline.autoNext).toBeUndefined()
      })
    })

    describe('Rundown has an infinite Piece', () => {
      describe('infinite Piece is an "inTransition" Pieces', () => {
        it('does not create an infinite Piece group', async () => {
          const infinitePiece: Piece = EntityMockFactory.createPiece({
            transitionType: TransitionType.IN_TRANSITION,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const rundown: Rundown = EntityMockFactory.createActiveRundown({infinitePieces: [infinitePiece]})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
            group.id.includes(INFINITE_GROUP_PREFIX)
          )

          expect(infiniteGroup).toBeUndefined()
        })
      })

      describe('infinite Piece is an "outTransition" Pieces', () => {
        it('does not create an infinite Piece group', async () => {
          const infinitePiece: Piece = EntityMockFactory.createPiece({
            transitionType: TransitionType.OUT_TRANSITION,
            pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
          })
          const rundown: Rundown = EntityMockFactory.createActiveRundown({infinitePieces: [infinitePiece]})

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

          const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
            group.id.includes(INFINITE_GROUP_PREFIX)
          )

          expect(infiniteGroup).toBeUndefined()
        })
      })

      describe('infinite Piece is not a "transition" Piece"', () => {
        describe('infinite Piece belongs to the active Part', () => {
          it('does not create infinite groups for Piece', async () => {
            const activePartId: string = 'activePartId'
            const infinitePiece: Piece = EntityMockFactory.createPiece({
              partId: activePartId,
              transitionType: TransitionType.NO_TRANSITION,
              pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
            })
            const activePart: Part = EntityMockFactory.createPart({id: activePartId})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({
              activePart,
              infinitePieces: [infinitePiece],
            })

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

            const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find((group) =>
              group.id.includes(INFINITE_GROUP_PREFIX)
            )

            expect(infiniteGroup).toBeUndefined()
          })
        })

        describe('infinite Piece does not belong to the active Part', () => {
          describe('infinite Piece does not have an executedAt larger than zero', () => {
            it('throws an error', async () => {
              const infinitePiece: Piece = EntityMockFactory.createPiece({
                partId: 'randomPartId',
                transitionType: TransitionType.NO_TRANSITION,
                pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
              })
              const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({
                activePart,
                infinitePieces: [infinitePiece],
              })

              const testee: TimelineBuilder = createTestee()

              await expect(() => testee.buildTimeline(rundown, createBasicStudioMock())).rejects.toThrow()
            })
          })

          describe('infinite Piece has an executedAt larger than zero', () => {
            describe('creates an infinite group for Piece', () => {
              it('sets correct infinite group id', async () => {
                const infinitePiece: Piece = EntityMockFactory.createPiece(
                  {
                    partId: 'randomPartId',
                    transitionType: TransitionType.NO_TRANSITION,
                    pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                  },
                  {executedAt: 100}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  infinitePieces: [infinitePiece],
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const expectedInfinitePieceGroupId: string = `${INFINITE_GROUP_PREFIX}${activePart.id}_${infinitePiece.id}`
                const infiniteGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
                  (group) => group.id === expectedInfinitePieceGroupId
                )

                expect(infiniteGroup).not.toBeUndefined()
              })

              it('sets priority to medium', async () => {
                const infinitePiece: Piece = EntityMockFactory.createPiece(
                  {
                    partId: 'randomPartId',
                    transitionType: TransitionType.NO_TRANSITION,
                    pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                  },
                  {executedAt: 100}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  infinitePieces: [infinitePiece],
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(INFINITE_GROUP_PREFIX)
                )!

                expect(infiniteGroup.priority).toBe(MEDIUM_PRIORITY)
              })

              it('sets TimelineEnable.start to Piece.executedAt', async () => {
                const executedAt: number = 200
                const infinitePiece: Piece = EntityMockFactory.createPiece(
                  {
                    partId: 'randomPartId',
                    transitionType: TransitionType.NO_TRANSITION,
                    pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                  },
                  {executedAt}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  infinitePieces: [infinitePiece],
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(INFINITE_GROUP_PREFIX)
                )!

                expect(infiniteGroup.enable.start).toBe(executedAt)
              })

              it('sets the layer to Piece.layer', async () => {
                const layer: string = 'someLayerForInfinitePiece'
                const infinitePiece: Piece = EntityMockFactory.createPiece(
                  {
                    layer,
                    partId: 'randomPartId',
                    transitionType: TransitionType.NO_TRANSITION,
                    pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                  },
                  {executedAt: 100}
                )
                const activePart: Part = EntityMockFactory.createPart({
                  id: 'activeId',
                })
                const rundown: Rundown = EntityMockFactory.createActiveRundown({
                  activePart,
                  infinitePieces: [infinitePiece],
                })

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                  group.id.includes(INFINITE_GROUP_PREFIX)
                )!

                expect(infiniteGroup.layer).toBe(layer)
              })

              describe('infinite Piece has a TimelineObject', () => {
                it('sets the id of the TimelineObject to be infinitePieceGroup.id_piece.id_timelineObject.id', async () => {
                  const timelineObject: TimelineObject = {id: 'timelineObject'} as TimelineObject
                  const infinitePiece: Piece = EntityMockFactory.createPiece(
                    {
                      timelineObjects: [timelineObject],
                      partId: 'randomPartId',
                      transitionType: TransitionType.NO_TRANSITION,
                      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                    },
                    {executedAt: 100}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    infinitePieces: [infinitePiece],
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(INFINITE_GROUP_PREFIX)
                  )!
                  const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
                  const result: TimelineObject | undefined = infiniteGroup.children.find(
                    (child) => child.id === expectedTimelineObjectId
                  )

                  expect(result).not.toBeUndefined()
                })

                it('sets the group of the TimelineObject to be the infinite Piece group', async () => {
                  const timelineObject: TimelineObject = {id: 'timelineObject'} as TimelineObject
                  const infinitePiece: Piece = EntityMockFactory.createPiece(
                    {
                      timelineObjects: [timelineObject],
                      partId: 'randomPartId',
                      transitionType: TransitionType.NO_TRANSITION,
                      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                    },
                    {executedAt: 100}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    infinitePieces: [infinitePiece],
                  })

                  const testee: TimelineBuilder = createTestee()
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(INFINITE_GROUP_PREFIX)
                  )!
                  const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
                  const result: TimelineObject = infiniteGroup.children.find(
                    (child) => child.id === expectedTimelineObjectId
                  )!

                  expect(result.inGroup).toBe(infiniteGroup.id)
                })

                it('has same content as the TimelineObject', async () => {
                  const content: unknown = {someContent: 'someContent'}
                  const timelineObject: TimelineObject = {
                    id: 'timelineObjectId',
                    content,
                  } as TimelineObject
                  const infinitePiece: Piece = EntityMockFactory.createPiece(
                    {
                      timelineObjects: [timelineObject],
                      partId: 'randomPartId',
                      transitionType: TransitionType.NO_TRANSITION,
                      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                    },
                    {executedAt: 100}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    infinitePieces: [infinitePiece],
                  })

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(
                    JSON.parse(JSON.stringify(timelineObject))
                  )

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(INFINITE_GROUP_PREFIX)
                  )!
                  const expectedTimelineObjectId: string = `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
                  const result: TimelineObject = infiniteGroup.children.find(
                    (child) => child.id === expectedTimelineObjectId
                  )!

                  expect(result.content).toEqual(content)
                })
              })

              describe('Piece has five TimelineObjects', () => {
                it('adds all five TimelineObjects to the children of the infinite Piece group', async () => {
                  const timelineObjects: TimelineObject[] = [
                    {id: '1'} as TimelineObject,
                    {id: '2'} as TimelineObject,
                    {id: '3'} as TimelineObject,
                    {id: '4'} as TimelineObject,
                    {id: '5'} as TimelineObject,
                  ]
                  const infinitePiece: Piece = EntityMockFactory.createPiece(
                    {
                      timelineObjects,
                      partId: 'randomPartId',
                      transitionType: TransitionType.NO_TRANSITION,
                      pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
                    },
                    {executedAt: 100}
                  )
                  const activePart: Part = EntityMockFactory.createPart({
                    id: 'activeId',
                  })
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({
                    activePart,
                    infinitePieces: [infinitePiece],
                  })

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  timelineObjects.forEach((timelineObject) =>
                    when(objectCloner.clone(timelineObject)).thenReturn(
                      JSON.parse(JSON.stringify(timelineObject))
                    )
                  )

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

                  const infiniteGroup: TimelineObjectGroup = timeline.timelineGroups.find((group) =>
                    group.id.includes(INFINITE_GROUP_PREFIX)
                  )!

                  const timelineObjectIds: string[] = infiniteGroup.children.map(
                    (timelineObject) => timelineObject.id
                  )
                  timelineObjects.forEach((timelineObject) =>
                    expect(timelineObjectIds).toContainEqual(
                      `${infiniteGroup.id}_${infinitePiece.id}_${timelineObject.id}`
                    )
                  )
                })
              })
            })
          })
        })
      })
    })

    describe('Rundown has multiple valid infinite Pieces', () => {
      it('creates infinite groups for all infinite Pieces', async () => {
        const infinitePieces: Piece[] = [
          EntityMockFactory.createPiece(
            {
              id: 'infiniteOne',
              layer: 'layerOne',
              partId: 'randomPartId',
              transitionType: TransitionType.NO_TRANSITION,
              pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
            },
            {
              executedAt: 100,
            }
          ),
          EntityMockFactory.createPiece(
            {
              id: 'infiniteTwo',
              layer: 'layerTwo',
              partId: 'randomPartId',
              transitionType: TransitionType.NO_TRANSITION,
              pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
            },
            {
              executedAt: 100,
            }
          ),
          EntityMockFactory.createPiece(
            {
              id: 'infiniteThree',
              layer: 'layerThree',
              partId: 'randomPartId',
              transitionType: TransitionType.NO_TRANSITION,
              pieceLifespan: PieceLifespan.STICKY_UNTIL_RUNDOWN_CHANGE,
            },
            {
              executedAt: 100,
            }
          ),
        ]
        const activePart: Part = EntityMockFactory.createPart({id: 'activeId'})
        const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, infinitePieces})

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const infiniteGroups: TimelineObjectGroup[] = timeline.timelineGroups.filter((group) =>
          group.id.includes(INFINITE_GROUP_PREFIX)
        )

        expect(infiniteGroups).toHaveLength(3)
      })
    })

    describe('Rundown does not have any infinite Pieces', () => {
      it('does not create any infinite Piece groups', async () => {
        const rundown: Rundown = EntityMockFactory.createActiveRundown()

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const infiniteGroups: TimelineObjectGroup[] = timeline.timelineGroups.filter((group) =>
          group.id.includes(INFINITE_GROUP_PREFIX)
        )

        expect(infiniteGroups).toHaveLength(0)
      })
    })

    describe('it builds lookahead group', () => {
      it('sets the correct lookahead group id', async () => {
        const rundown: Rundown = EntityMockFactory.createActiveRundown()

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const lookaheadGroup: TimelineObjectGroup | undefined = timeline.timelineGroups.find(
          (group) => group.id === LOOKAHEAD_GROUP_ID
        )
        expect(lookaheadGroup).not.toBeUndefined()
      })

      it('sets the enable to while="1"', async () => {
        const rundown: Rundown = EntityMockFactory.createActiveRundown()

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
          (group) => group.id === LOOKAHEAD_GROUP_ID
        )!
        expect(lookaheadGroup.enable.while).toBe('1')
      })

      it('sets the layer to be empty', async () => {
        const rundown: Rundown = EntityMockFactory.createActiveRundown()

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
          (group) => group.id === LOOKAHEAD_GROUP_ID
        )!
        expect(lookaheadGroup.layer).toBe('')
      })

      it('sets the priority to Lookahead priority', async () => {
        const rundown: Rundown = EntityMockFactory.createActiveRundown()

        const testee: TimelineBuilder = createTestee()
        const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock())

        const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
          (group) => group.id === LOOKAHEAD_GROUP_ID
        )!
        expect(lookaheadGroup.priority).toBe(LOOKAHEAD_PRIORITY)
      })

      describe('there are no layers with Lookahead', () => {
        it('does not add any children to the lookahead group', async () => {
          const timelineObject: TimelineObject = {
            id: 'timelineObject',
            layer: 'someLayer',
          } as TimelineObject
          const piece: Piece = EntityMockFactory.createPiece({timelineObjects: [timelineObject]})
          const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
          const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})

          const studioLayers: StudioLayer[] = []

          const testee: TimelineBuilder = createTestee()
          const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock(studioLayers))

          const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
            (group) => group.id === LOOKAHEAD_GROUP_ID
          )!
          expect(lookaheadGroup.children).toHaveLength(0)
        })

        describe('there are layers without lookahead', () => {
          it('does not add any children to the lookahead group', async () => {
            const timelineObject: TimelineObject = {
              id: 'timelineObject',
              layer: 'someLayer',
            } as TimelineObject
            const piece: Piece = EntityMockFactory.createPiece({timelineObjects: [timelineObject]})
            const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
            const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
            const studioLayers: StudioLayer[] = [
              createStudioLayer({name: timelineObject.layer, lookaheadMode: LookaheadMode.NONE}),
            ]

            const testee: TimelineBuilder = createTestee()
            const timeline: Timeline = await testee.buildTimeline(rundown, createBasicStudioMock(studioLayers))

            const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
              (group) => group.id === LOOKAHEAD_GROUP_ID
            )!
            expect(lookaheadGroup.children).toHaveLength(0)
          })
        })
      })

      describe('there is one layer with Lookahead', () => {
        describe('it gets the Pieces of the active Part', () => {
          describe('active Part only have infinite Pieces', () => {
            it('does not add any children to the lookahead group', async () => {
              const timelineObject: TimelineObject = {
                id: 'timelineObject',
                layer: 'someLayer',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
                timelineObjects: [timelineObject],
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: timelineObject.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(0)
            })
          })

          describe('active Part does not have any Pieces with TimelineObjects on a Lookahead layer', () => {
            it('does not add any children to the lookahead group', async () => {
              const timelineObject: TimelineObject = {
                id: 'timelineObject',
                layer: 'completelyRandomLayer',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({timelineObjects: [timelineObject]})
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({lookaheadMode: LookaheadMode.WHEN_CLEAR}),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(0)
            })
          })

          describe('active Part has one TimelineObject for the lookahead layer', () => {
            describe('it adds the TimelineObject to the children of the lookahead group', () => {
              it('sets the id to be "lookaheadGroupId_timelineObject.id"', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject | undefined =
                  lookaheadGroup.children.find(
                    (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                  )
                expect(lookaheadTimelineObject).not.toBeUndefined()
              })

              it('sets the priority to be the lookahead priority', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )!
                expect(lookaheadTimelineObject.priority).toBe(LOOKAHEAD_PRIORITY)
              })

              it('sets lookahead to be true', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: LookaheadTimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )! as LookaheadTimelineObject
                expect(lookaheadTimelineObject.isLookahead).toBe(true)
              })

              it('sets the start to be 0', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )!
                expect(lookaheadTimelineObject.enable.start).toBe(0)
              })

              it('sets the end to be when the active group starts', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )!
                expect(lookaheadTimelineObject.enable.end).toBe(
                  `#${ACTIVE_GROUP_PREFIX}${activePart.id}.start`
                )
              })

              it('sets the group id to be the Lookahead group id', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )!
                expect(lookaheadTimelineObject.inGroup).toBe(LOOKAHEAD_GROUP_ID)
              })

              it('sets the content to be the content of the TimelineObject', async () => {
                const content: unknown = {
                  someContent: 'doesntMatterWhat',
                }
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'layerName',
                  content,
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const objectCloner: ObjectCloner = mock<ObjectCloner>()
                when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                const testee: TimelineBuilder = createTestee(instance(objectCloner))
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                )!
                expect(lookaheadTimelineObject.content).toBe(content)
              })

              describe('the layer is a WHEN_CLEAR lookahead layer', () => {
                it('sets the layer to be the layer of the TimelineObject', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'layerName',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.WHEN_CLEAR,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                    (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                  )!
                  expect(lookaheadTimelineObject.layer).toBe(timelineObject.layer)
                })
              })

              describe('the layer is a PRELOAD lookahead layer', () => {
                it('sets the "lookaheadForLayer" to be the same as the layer of the timelineObject', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'layerName',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.PRELOAD,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: LookaheadTimelineObject =
                    lookaheadGroup.children.find(
                      (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                    )! as LookaheadTimelineObject
                  expect(lookaheadTimelineObject.layer).toBe(`${timelineObject.layer}_lookahead`)
                })

                it('sets the "layer" to be the layer of the TimelineObject post-fixed with "_lookahead"', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'layerName',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.PRELOAD,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: LookaheadTimelineObject =
                    lookaheadGroup.children.find(
                      (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`
                    )! as LookaheadTimelineObject
                  expect(lookaheadTimelineObject.lookaheadForLayer).toBe(timelineObject.layer)
                })
              })
            })
          })

          describe('active Part has two TimelineObjects for the lookahead layer', () => {
            it('adds them both to the children of the lookahead group', async () => {
              const timelineObjectOne: TimelineObject = {
                id: 'timelineObjectOne',
                layer: 'layerName',
              } as TimelineObject
              const timelineObjectTwo: TimelineObject = {
                id: 'timelineObjectTwo',
                layer: 'someOtherLayerName',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [timelineObjectOne, timelineObjectTwo],
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: timelineObjectOne.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
                createStudioLayer({
                  name: timelineObjectTwo.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              const childrenIds: string[] = lookaheadGroup.children.map((o) => o.id)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${timelineObjectOne.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${timelineObjectTwo.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`)
            })
          })
        })

        describe('it gets the Pieces from the next Part', () => {
          describe('next Part only have infinite Pieces', () => {
            it('does not add any children to the lookahead group', async () => {
              const timelineObject: TimelineObject = {
                id: 'timelineObject',
                layer: 'someLayer',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                pieceLifespan: PieceLifespan.SPANNING_UNTIL_RUNDOWN_END,
                timelineObjects: [timelineObject],
              })
              const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: timelineObject.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(0)
            })
          })

          describe('next Part does not have any Pieces with TimelineObjects on a Lookahead layer', () => {
            it('does not add any children to the lookahead group', async () => {
              const timelineObject: TimelineObject = {
                id: 'timelineObject',
                layer: 'someLayerWithNoLookahead',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({timelineObjects: [timelineObject]})
              const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({lookaheadMode: LookaheadMode.WHEN_CLEAR}),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(0)
            })
          })

          describe('next Part has one TimelineObject for the lookahead layer', () => {
            describe('it adds the TimelineObject to the children of the lookahead group', () => {
              it('sets the id to be "lookaheadGroupId_timelineObject.id"', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject | undefined =
                  lookaheadGroup.children.find(
                    (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                  )
                expect(lookaheadTimelineObject).not.toBeUndefined()
              })

              it('sets the priority to be the lookahead priority', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )!
                expect(lookaheadTimelineObject.priority).toBe(LOOKAHEAD_PRIORITY)
              })

              it('sets lookahead to be true', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: LookaheadTimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )! as LookaheadTimelineObject
                expect(lookaheadTimelineObject.isLookahead).toBe(true)
              })

              it('sets the enable to be while active group is present', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const activePart: Part = EntityMockFactory.createPart({id: 'activePartId'})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({activePart, nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )!
                expect(lookaheadTimelineObject.enable.while).toBe(
                  `#${ACTIVE_GROUP_PREFIX}${activePart.id}`
                )
              })

              it('sets the group id to be the Lookahead group id', async () => {
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )!
                expect(lookaheadTimelineObject.inGroup).toBe(LOOKAHEAD_GROUP_ID)
              })

              it('sets the content to be the content of the TimelineObject', async () => {
                const content: unknown = {
                  someContent: 'couldBeAnything',
                }
                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                  content,
                } as TimelineObject
                const piece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const objectCloner: ObjectCloner = mock<ObjectCloner>()
                when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                const testee: TimelineBuilder = createTestee(instance(objectCloner))
                const timeline: Timeline = await testee.buildTimeline(
                  rundown,
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                  (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )!
                expect(lookaheadTimelineObject.content).toBe(content)
              })

              describe('the layer is a WHEN_CLEAR lookahead layer', () => {
                it('sets the layer to be the layer of the TimelineObject', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'someLayer',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.WHEN_CLEAR,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: TimelineObject = lookaheadGroup.children.find(
                    (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                  )!
                  expect(lookaheadTimelineObject.layer).toBe(timelineObject.layer)
                })
              })

              describe('the layer is a PRELOAD lookahead layer', () => {
                it('sets the "lookaheadForLayer" to be the same as the layer of the timelineObject', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'someLayer',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.PRELOAD,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: LookaheadTimelineObject =
                    lookaheadGroup.children.find(
                      (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                    )! as LookaheadTimelineObject
                  expect(lookaheadTimelineObject.lookaheadForLayer).toBe(timelineObject.layer)
                })

                it('sets the "layer" to be the layer of the TimelineObject post-fixed with "_lookahead"', async () => {
                  const timelineObject: TimelineObject = {
                    id: 'timelineObject',
                    layer: 'someLayer',
                  } as TimelineObject
                  const piece: Piece = EntityMockFactory.createPiece({
                    timelineObjects: [timelineObject],
                  })
                  const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
                  const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
                  const studioLayers: StudioLayer[] = [
                    createStudioLayer({
                      name: timelineObject.layer,
                      lookaheadMode: LookaheadMode.PRELOAD,
                    }),
                  ]

                  const objectCloner: ObjectCloner = mock<ObjectCloner>()
                  when(objectCloner.clone(timelineObject)).thenReturn(timelineObject)

                  const testee: TimelineBuilder = createTestee(instance(objectCloner))
                  const timeline: Timeline = await testee.buildTimeline(
                    rundown,
                    createBasicStudioMock(studioLayers)
                  )

                  const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                    (group) => group.id === LOOKAHEAD_GROUP_ID
                  )!
                  const lookaheadTimelineObject: LookaheadTimelineObject =
                    lookaheadGroup.children.find(
                      (o) => o.id === `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                    )! as LookaheadTimelineObject
                  expect(lookaheadTimelineObject.layer).toBe(`${timelineObject.layer}_lookahead`)
                })
              })
            })
          })

          describe('next Part has two TimelineObjects with lookahead layer', () => {
            it('adds them both to the children of the lookahead group', async () => {
              const timelineObjectOne: TimelineObject = {
                id: 'timelineObjectOne',
                layer: 'someLayer',
              } as TimelineObject
              const timelineObjectTwo: TimelineObject = {
                id: 'timelineObjectTwo',
                layer: 'someOtherLayer',
              } as TimelineObject
              const piece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [timelineObjectOne, timelineObjectTwo],
              })
              const nextPart: Part = EntityMockFactory.createPart({pieces: [piece]})
              const rundown: Rundown = EntityMockFactory.createActiveRundown({nextPart})
              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: timelineObjectOne.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
                createStudioLayer({
                  name: timelineObjectTwo.layer,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const objectCloner: ObjectCloner = mock<ObjectCloner>()
              when(objectCloner.clone(timelineObjectOne)).thenReturn(timelineObjectOne)

              const testee: TimelineBuilder = createTestee(instance(objectCloner))
              const timeline: Timeline = await testee.buildTimeline(
                rundown,
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              const childrenIds: string[] = lookaheadGroup.children.map((o) => o.id)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${timelineObjectOne.id}`)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${timelineObjectTwo.id}`)
            })
          })

          describe('layer has a minimumLookahead set to one', () => {
            describe('it has two TimelineObjects for layer', () => {
              it('only adds the first TimelineObject to the children of the lookahead group', async () => {
                const firstTimelineObject: TimelineObject = {
                  id: 'firstTimelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const firstPiece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [firstTimelineObject],
                })
                const firstPart: Part = EntityMockFactory.createPart({pieces: [firstPiece]})

                const secondTimelineObject: TimelineObject = {
                  id: 'secondTimelineObject',
                  layer: firstTimelineObject.layer,
                } as TimelineObject
                const secondPiece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [secondTimelineObject],
                })
                const secondPart: Part = EntityMockFactory.createPart({pieces: [secondPiece]})

                const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                  nextPart: firstPart,
                })
                when(rundown.getPartAfter(firstPart)).thenReturn(secondPart)

                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: firstTimelineObject.layer,
                    amountOfLookaheadObjectsToFind: 1,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  instance(rundown),
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                expect(lookaheadGroup.children).toHaveLength(1)
                expect(lookaheadGroup.children[0].id).toBe(
                  `${LOOKAHEAD_GROUP_ID}_${firstTimelineObject.id}`
                )
              })
            })

            describe('it has the first TimelineObject for the layer on just before the maximumSearchDistance', () => {
              it('adds the TimelineObject to the children of the lookahead group', async () => {
                const firstPiece: Piece = EntityMockFactory.createPiece()
                const firstPart: Part = EntityMockFactory.createPart({pieces: [firstPiece]})

                const secondPiece: Piece = EntityMockFactory.createPiece()
                const secondPart: Part = EntityMockFactory.createPart({pieces: [secondPiece]})

                const thirdPiece: Piece = EntityMockFactory.createPiece()
                const thirdPart: Part = EntityMockFactory.createPart({pieces: [thirdPiece]})

                const timelineObject: TimelineObject = {
                  id: 'timelineObject',
                  layer: 'someLayer',
                } as TimelineObject
                const lastPiece: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObject],
                })
                const lastPart: Part = EntityMockFactory.createPart({pieces: [lastPiece]})

                const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                  nextPart: firstPart,
                })
                when(rundown.getPartAfter(firstPart)).thenReturn(secondPart)
                when(rundown.getPartAfter(secondPart)).thenReturn(thirdPart)
                when(rundown.getPartAfter(thirdPart)).thenReturn(lastPart)

                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObject.layer,
                    maximumLookaheadSearchDistance: 4,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  instance(rundown),
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                expect(lookaheadGroup.children).toHaveLength(1)
                expect(lookaheadGroup.children[0].id).toBe(
                  `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}`
                )
              })
            })

            describe('it has no TimelineObject for layer within the maximumSearchDistance', () => {
              it('does not add any children to the lookahead group', async () => {
                const firstPiece: Piece = EntityMockFactory.createPiece()
                const firstPart: Part = EntityMockFactory.createPart({pieces: [firstPiece]})

                const secondPiece: Piece = EntityMockFactory.createPiece()
                const secondPart: Part = EntityMockFactory.createPart({pieces: [secondPiece]})

                const thirdPiece: Piece = EntityMockFactory.createPiece()
                const thirdPart: Part = EntityMockFactory.createPart({pieces: [thirdPiece]})

                const timelineObjectOutsideSearchDistance: TimelineObject = {
                  id: 'timelineObjectOutsideSearchDistance',
                  layer: 'someLayer',
                } as TimelineObject
                const pieceOutsideSearchDistance: Piece = EntityMockFactory.createPiece({
                  timelineObjects: [timelineObjectOutsideSearchDistance],
                })
                const partOutsideSearchDistance: Part = EntityMockFactory.createPart({
                  pieces: [pieceOutsideSearchDistance],
                })

                const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                  nextPart: firstPart,
                })
                when(rundown.getPartAfter(firstPart)).thenReturn(secondPart)
                when(rundown.getPartAfter(secondPart)).thenReturn(thirdPart)
                when(rundown.getPartAfter(thirdPart)).thenReturn(partOutsideSearchDistance)

                const studioLayers: StudioLayer[] = [
                  createStudioLayer({
                    name: timelineObjectOutsideSearchDistance.layer,
                    maximumLookaheadSearchDistance: 1,
                    lookaheadMode: LookaheadMode.WHEN_CLEAR,
                  }),
                ]

                const testee: TimelineBuilder = createTestee()
                const timeline: Timeline = await testee.buildTimeline(
                  instance(rundown),
                  createBasicStudioMock(studioLayers)
                )

                const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                  (group) => group.id === LOOKAHEAD_GROUP_ID
                )!
                expect(lookaheadGroup.children).toHaveLength(0)
              })
            })

            it('does not count TimelineObjects from the active Part among minimumLookaheadObjects', async () => {
              const activePartTimelineObject: TimelineObject = {
                id: 'activePartTimelineObject',
                layer: 'someLayer',
              } as TimelineObject
              const activePiece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [activePartTimelineObject],
              })
              const activePart: Part = EntityMockFactory.createPart({pieces: [activePiece]})

              const lookaheadTimelineObject: TimelineObject = {
                id: 'lookaheadTimelineObject',
                layer: activePartTimelineObject.layer,
              } as TimelineObject
              const lookAheadPiece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [lookaheadTimelineObject],
              })
              const lookAheadPart: Part = EntityMockFactory.createPart({pieces: [lookAheadPiece]})

              const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                activePart,
                nextPart: lookAheadPart,
              })
              when(rundown.getPartAfter(activePart)).thenReturn(lookAheadPart)

              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: activePartTimelineObject.layer,
                  amountOfLookaheadObjectsToFind: 1,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                instance(rundown),
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(2)
              const childrenIds: string[] = lookaheadGroup.children.map((child) => child.id)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${activePartTimelineObject.id}${LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX}`)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${lookaheadTimelineObject.id}`)
            })
          })

          describe('layer has a minimumLookahead set to two', () => {
            it('returns both TimelineObjects', async () => {
              const firstTimelineObject: TimelineObject = {
                id: 'firstTimelineObject',
                layer: 'someLayer',
              } as TimelineObject
              const firstPiece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [firstTimelineObject],
              })
              const firstPart: Part = EntityMockFactory.createPart({pieces: [firstPiece]})

              const secondTimelineObject: TimelineObject = {
                id: 'secondTimelineObject',
                layer: firstTimelineObject.layer,
              } as TimelineObject
              const secondPiece: Piece = EntityMockFactory.createPiece({
                timelineObjects: [secondTimelineObject],
              })
              const secondPart: Part = EntityMockFactory.createPart({pieces: [secondPiece]})

              const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                nextPart: firstPart,
              })
              when(rundown.getPartAfter(firstPart)).thenReturn(secondPart)

              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: firstTimelineObject.layer,
                  amountOfLookaheadObjectsToFind: 2,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                instance(rundown),
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(2)
              const childrenIds: string[] = lookaheadGroup.children.map((child) => child.id)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${firstTimelineObject.id}`)
              expect(childrenIds).toContain(`${LOOKAHEAD_GROUP_ID}_${secondTimelineObject.id}`)
            })
          })

          describe('Rundown runs out of Parts before maximum search distance is reached', () => {
            it('does not add any children to the lookahead group', async () => {
              const parts: Part[] = [
                EntityMockFactory.createPart({id: 'firstPartId'}),
                EntityMockFactory.createPart({id: 'secondPartId'}),
                EntityMockFactory.createPart({id: 'thirdPartId'}),
              ]

              const rundown: Rundown = EntityMockFactory.createActiveRundownMock({
                nextPart: parts[0],
              })
              when(rundown.getPartAfter(parts[0])).thenReturn(parts[1])
              when(rundown.getPartAfter(parts[1])).thenReturn(parts[2])
              when(rundown.getPartAfter(parts[2])).thenThrow(new LastPartInRundownException(''))

              const studioLayers: StudioLayer[] = [
                createStudioLayer({
                  name: 'someLayer',
                  maximumLookaheadSearchDistance: 10,
                  lookaheadMode: LookaheadMode.WHEN_CLEAR,
                }),
              ]

              const testee: TimelineBuilder = createTestee()
              const timeline: Timeline = await testee.buildTimeline(
                instance(rundown),
                createBasicStudioMock(studioLayers)
              )

              const lookaheadGroup: TimelineObjectGroup = timeline.timelineGroups.find(
                (group) => group.id === LOOKAHEAD_GROUP_ID
              )!
              expect(lookaheadGroup.children).toHaveLength(0)
            })
          })
        })
      })
    })
  })
})

function createTestee(objectCloner?: ObjectCloner): SuperflyTimelineBuilder {
  if (!objectCloner) {
    const objectClonerMock: ObjectCloner = mock<ObjectCloner>()
    when(objectClonerMock.clone(anything())).thenReturn({})
    objectCloner = instance(objectClonerMock)
  }

  return new SuperflyTimelineBuilder(objectCloner)
}

function createBasicStudioMock(layers?: StudioLayer[]): Studio {
  const studioMock: Studio = mock<Studio>()
  when(studioMock.layers).thenReturn(layers ?? [])
  return instance(studioMock)
}

function createStudioLayer(layer: Partial<StudioLayer>): StudioLayer {
  return {
    name: layer?.name ?? 'layerName',
    amountOfLookaheadObjectsToFind: layer?.amountOfLookaheadObjectsToFind ?? 1,
    maximumLookaheadSearchDistance: layer?.maximumLookaheadSearchDistance ?? 10,
    lookaheadMode: layer?.lookaheadMode ?? LookaheadMode.NONE,
  }
}
