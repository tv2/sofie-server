import { Tv2OnTimelineGenerateCalculator } from '../tv2-on-timeline-generate-calculator'
import { Tv2SisyfosPersistentLayerFinder } from '../helpers/tv2-sisyfos-persistent-layer-finder'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Configuration } from '../../../model/entities/configuration'
import { EntityMockFactory } from '../../../model/entities/test/entity-mock-factory'
import { Part } from '../../../model/entities/part'
import { OnTimelineGenerateResult } from '../../../model/value-objects/on-timeline-generate-result'
import { Tv2MediaPlayerSession, Tv2RundownPersistentState } from '../value-objects/tv2-rundown-persistent-state'
import { Timeline } from '../../../model/entities/timeline'
import { TimelineObject, TimelineObjectGroup } from '../../../model/entities/timeline-object'
import { Tv2MediaPlayer, Tv2StudioBlueprintConfiguration } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject, Tv2TimelineObjectMetaData } from '../value-objects/tv2-meta-data'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const LOOK_AHEAD_GROUP_ID: string = 'look_ahead_group'

describe(`${Tv2OnTimelineGenerateCalculator.name}`, () => {
  describe(`${Tv2OnTimelineGenerateCalculator.prototype.onTimelineGenerate.name}`, () => {
    describe('the active Part is from the same Segment as the previous Part', () => {
      it('sets isNewSegment to false', () => {
        const configuration: Configuration = createConfiguration()
        const timeline: Timeline = createTimeline()
        const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState()
        const segmentId: string = 'segmentId'
        const activePart: Part = EntityMockFactory.createPart({ segmentId })
        const previousPart: Part = EntityMockFactory.createPart({ segmentId })

        const testee: Tv2OnTimelineGenerateCalculator = createTestee()
        const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, activePart, previousPart, timeline)
        const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

        expect(result.isNewSegment).toBeFalsy()
      })
    })

    describe('the active Part is from a different Segment than the previous Part', () => {
      it('sets isNewSegment to true', () => {
        const configuration: Configuration = createConfiguration()
        const timeline: Timeline = createTimeline()
        const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState()
        const activePart: Part = EntityMockFactory.createPart({ segmentId: 'someSegmentId' })
        const previousPart: Part = EntityMockFactory.createPart({ segmentId: 'someOtherSegmentId' })

        const testee: Tv2OnTimelineGenerateCalculator = createTestee()
        const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, activePart, previousPart, timeline)
        const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

        expect(result.isNewSegment).toBeTruthy()
      })
    })

    describe('there are no assigned mediaPlayerSessions', () => {
      describe('there are no TimelineObjects who wants to have use a MediaPlayer', () => {
        it('assigns no MediaPlayerSessions', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const timeline: Timeline = createTimeline()
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(0)
        })
      })

      describe('there is a TimelineObject on the active Part that wants a MediaPlayer', () => {
        it('assigns a MediaPlayerSession to that TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const sessionId: string = 'someSession'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
        })
      })

      describe('there is a LookAhead who wants a MediaPlayer', () => {
        it('assigns a MediaPlayer to the LookAhead TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const sessionId: string = 'someSession'
          const timeline: Timeline = createTimeline({
            lookAheadGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
        })
      })

      describe('there are two LookAhead TimelineObjects who wants their own MediaPlayer', () => {
        it('assigns a MediaPlayer to each LookAhead TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const firstSessionId: string = 'firstSessionId'
          const secondSessionId: string = 'secondSessionId'
          const timeline: Timeline = createTimeline({
            lookAheadGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
              createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
        })
      })

      describe('there are as many active Part TimelineObjects who wants a their own MediaPlayer', () => {
        it('assigns a MediaPlayer to each active Part TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const firstSessionId: string = 'firstSessionId'
          const secondSessionId: string = 'secondSessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
              createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
        })

        describe('there is also a LookAhead who wants a MediaPlayer', () => {
          it('does not assign a MediaPlayer to the LookAhead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
                createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
          })
        })
      })

      describe('there are two TimelineObjects who wants to have the same MediaPlayer', () => {
        it('assigns one MediaPlayer', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const sessionId: string = 'sessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId }),
              createTimelineObject('someOtherId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
        })
      })
    })

    describe('there is one MediaPlayer previously assigned', () => {
      describe('no TimelineObjects wants a MediaPlayer', () => {
        it('no longer has any assigned MediaPlayers', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const timeline: Timeline = createTimeline()
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId: 'someSessionId',
              mediaPlayer: {
                _id: '1'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(0)
        })
      })

      describe('there is an active TimelineObject who wants to continue using that MediaPlayer', () => {
        it('still has the MediaPlayer assigned to the same Session', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const sessionId: string = 'sessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId,
              mediaPlayer: {
                _id: '1'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')
        })

        describe('there is a LookAhead TimelineObject who wants a MediaPlayer', () => {
          it('it gets a different Media Player assigned', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const sessionId: string = 'sessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: sessionId })
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  _id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookAheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('2')
          })
        })

        describe('there are two more LookAhead who wants a MediaPlayer, but only one MediaPlayer available', () => {
          it('assigns the MediaPlayer to the first LookAhead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const sessionId: string = 'sessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const secondLookAheadSessionId: string = 'secondLookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: sessionId })
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId }),
                createTimelineObject('secondLookAheadId', { mediaPlayerSession: secondLookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  _id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookAheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('2')
          })
        })
      })

      describe('there is no active Part that wants to continue using the MediaPlayer', () => {
        describe('there is as many LookAhead TimelineObjects as there is MediaPlayers that wants a MediaPlayer', () => {
          it('assigns all the MediaPlayers', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const sessionId: string = 'sessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const secondLookAheadSessionId: string = 'secondLookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId }),
                createTimelineObject('secondLookAheadId', { mediaPlayerSession: secondLookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  _id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(lookAheadSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('2')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondLookAheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('1')
          })
        })
      })
    })

    describe('all MediaPlayers are already assigned', () => {
      describe('active Part wants to continue using all MediaPlayers', () => {
        it('does not reassign the MediaPlayers', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const firstSessionId: string = 'firstSessionId'
          const secondSessionId: string = 'secondSessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
              createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId: firstSessionId,
              mediaPlayer: {
                _id: '1'
              } as Tv2MediaPlayer
            },
            {
              sessionId: secondSessionId,
              mediaPlayer: {
                _id: '2'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')

          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
          expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('2')
        })

        describe('there are LookAhead TimelineObjects that wants to use the MediaPlayers', () => {
          it('does not reassign the MediaPlayers', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
                createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId: firstSessionId,
                mediaPlayer: {
                  _id: '1'
                } as Tv2MediaPlayer
              },
              {
                sessionId: secondSessionId,
                mediaPlayer: {
                  _id: '2'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('2')
          })
        })
      })

      describe('active Part only wants to continue using one MediaPlayer', () => {
        it('unassigns the other MediaPlayers', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = createConfiguration(mediaPlayerIds)
          const firstSessionId: string = 'firstSessionId'
          const secondSessionId: string = 'secondSessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId: firstSessionId,
              mediaPlayer: {
                _id: '1'
              } as Tv2MediaPlayer
            },
            {
              sessionId: secondSessionId,
              mediaPlayer: {
                _id: '2'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateCalculator = createTestee()
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')
        })

        describe('there is a LookAhead TimelineObject that wants to use the MediaPlayer', () => {
          it('assigns the MediaPlayer no longer used by active Part to the LookAhead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = createConfiguration(mediaPlayerIds)
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookAheadSessionId: string = 'lookAheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId })
              ],
              lookAheadGroupTimelineObjects: [
                createTimelineObject('lookAheadId', { mediaPlayerSession: lookAheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId: firstSessionId,
                mediaPlayer: {
                  _id: '1'
                } as Tv2MediaPlayer
              },
              {
                sessionId: secondSessionId,
                mediaPlayer: {
                  _id: '2'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateCalculator = createTestee()
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, rundownPersistentState, part, undefined, timeline)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer._id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookAheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer._id).toBe('2')
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  sisyfosPersistentLayerFinder?: Tv2SisyfosPersistentLayerFinder
}): Tv2OnTimelineGenerateCalculator {
  let sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder | undefined = params?.sisyfosPersistentLayerFinder
  if (!params?.sisyfosPersistentLayerFinder) {
    const sisyfosPersistentLayerFinderMock = mock(Tv2SisyfosPersistentLayerFinder)
    when(sisyfosPersistentLayerFinderMock.findLayersToPersist(anything(), anything(), anything())).thenReturn([])
    sisyfosPersistentLayerFinder = instance(sisyfosPersistentLayerFinderMock)
  }
  return new Tv2OnTimelineGenerateCalculator(sisyfosPersistentLayerFinder!)
}

function createConfiguration(abMediaPlayerIds?: string[]): Configuration {
  return {
    studio: {
      blueprintConfiguration: {
        ABMediaPlayers: abMediaPlayerIds?.map(id => {
          return {
            _id: id
          }
        }) ?? []
      } as Tv2StudioBlueprintConfiguration,
      layers: []
    },
    showStyle: {
      blueprintConfiguration: undefined
    }
  }
}

function createTimeline(params?: { activeGroupTimelineObjects?: TimelineObject[], lookAheadGroupTimelineObjects?: TimelineObject[] }): Timeline {
  return {
    timelineGroups: [
      {
        id: ACTIVE_GROUP_PREFIX,
        children: params?.activeGroupTimelineObjects ?? [] as TimelineObject[]
      } as TimelineObjectGroup,
      {
        id: LOOK_AHEAD_GROUP_ID,
        children: params?.lookAheadGroupTimelineObjects ?? [] as TimelineObject[]
      } as TimelineObjectGroup
    ]
  }
}

function createRundownPersistentState(activeMediaPlayerSessions?: Tv2MediaPlayerSession[]): Tv2RundownPersistentState {
  return {
    activeMediaPlayerSessions: activeMediaPlayerSessions ?? []
  }
}

function createTimelineObject(id: string, metaData?: Tv2TimelineObjectMetaData): Tv2BlueprintTimelineObject {
  return {
    id,
    metaData,
    content: {}
  } as Tv2BlueprintTimelineObject
}
