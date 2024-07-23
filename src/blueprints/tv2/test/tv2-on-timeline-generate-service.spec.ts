import { Tv2OnTimelineGenerateService } from '../tv2-on-timeline-generate-service'
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
import { Tv2BlueprintTimelineObject, Tv2TimelineObjectMetadata } from '../value-objects/tv2-metadata'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2ConfigurationMapper } from '../helpers/tv2-configuration-mapper'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const LOOKAHEAD_GROUP_ID: string = 'lookahead_group'
const SHOW_STYLE_VARIANT_ID: string = 'showStyleVariantId'

describe(Tv2OnTimelineGenerateService.name, () => {
  describe(`${Tv2OnTimelineGenerateService.prototype.onTimelineGenerate.name}`, () => {
    describe('the active Part is from the same Segment as the previous Part', () => {
      it('sets isNewSegment to false', () => {
        const configuration: Configuration = {} as Configuration
        const timeline: Timeline = createTimeline()
        const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState()
        const segmentId: string = 'segmentId'
        const activePart: Part = EntityMockFactory.createPart({ segmentId })
        const previousPart: Part = EntityMockFactory.createPart({ segmentId })

        const testee: Tv2OnTimelineGenerateService = createTestee()
        const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, activePart, rundownPersistentState, previousPart)
        const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

        expect(result.isNewSegment).toBeFalsy()
      })
    })

    describe('the active Part is from a different Segment than the previous Part', () => {
      it('sets isNewSegment to true', () => {
        const configuration: Configuration = {} as Configuration
        const timeline: Timeline = createTimeline()
        const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState()
        const activePart: Part = EntityMockFactory.createPart({ segmentId: 'someSegmentId' })
        const previousPart: Part = EntityMockFactory.createPart({ segmentId: 'someOtherSegmentId' })

        const testee: Tv2OnTimelineGenerateService = createTestee()
        const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, activePart, rundownPersistentState, previousPart)
        const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

        expect(result.isNewSegment).toBeTruthy()
      })
    })

    describe('there are no assigned mediaPlayerSessions', () => {
      describe('there are no TimelineObjects who wants to have use a MediaPlayer', () => {
        it('assigns no MediaPlayerSessions', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
          const timeline: Timeline = createTimeline()
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(0)
        })
      })

      describe('there is a TimelineObject on the active Part that wants a MediaPlayer', () => {
        it('assigns a MediaPlayerSession to that TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
          const sessionId: string = 'someSession'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
        })
      })

      describe('there is a Lookahead who wants a MediaPlayer', () => {
        it('assigns a MediaPlayer to the Lookahead TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
          const sessionId: string = 'someSession'
          const timeline: Timeline = createTimeline({
            lookaheadGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: sessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
        })
      })

      describe('there are two Lookahead TimelineObjects who wants their own MediaPlayer', () => {
        it('assigns a MediaPlayer to each Lookahead TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
          const firstSessionId: string = 'firstSessionId'
          const secondSessionId: string = 'secondSessionId'
          const timeline: Timeline = createTimeline({
            lookaheadGroupTimelineObjects: [
              createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
              createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
            ]
          })
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
        })
      })

      describe('there are as many active Part TimelineObjects who wants a their own MediaPlayer', () => {
        it('assigns a MediaPlayer to each active Part TimelineObject', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
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

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
        })

        describe('there is also a Lookahead who wants a MediaPlayer', () => {
          it('does not assign a MediaPlayer to the Lookahead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
                createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
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
          const configuration: Configuration = {} as Configuration
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

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
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
          const configuration: Configuration = {} as Configuration
          const timeline: Timeline = createTimeline()
          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId: 'someSessionId',
              mediaPlayer: {
                id: '1'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(0)
        })
      })

      describe('there is an active TimelineObject who wants to continue using that MediaPlayer', () => {
        it('still has the MediaPlayer assigned to the same Session', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
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
                id: '1'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')
        })

        describe('there is a Lookahead TimelineObject who wants a MediaPlayer', () => {
          it('it gets a different Media Player assigned', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const sessionId: string = 'sessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: sessionId })
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookaheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('2')
          })
        })

        describe('there are two more Lookahead who wants a MediaPlayer, but only one MediaPlayer available', () => {
          it('assigns the MediaPlayer to the first Lookahead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const sessionId: string = 'sessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const secondLookaheadSessionId: string = 'secondLookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: sessionId })
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId }),
                createTimelineObject('secondLookaheadId', { mediaPlayerSession: secondLookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookaheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('2')
          })
        })
      })

      describe('there is no active Part that wants to continue using the MediaPlayer', () => {
        describe('there is as many Lookahead TimelineObjects as there is MediaPlayers that wants a MediaPlayer', () => {
          it('assigns all the MediaPlayers', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const sessionId: string = 'sessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const secondLookaheadSessionId: string = 'secondLookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId }),
                createTimelineObject('secondLookaheadId', { mediaPlayerSession: secondLookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId,
                mediaPlayer: {
                  id: '1'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(lookaheadSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('2')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondLookaheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('1')
          })
        })
      })
    })

    describe('all MediaPlayers are already assigned', () => {
      describe('active Part wants to continue using all MediaPlayers', () => {
        it('does not reassign the MediaPlayers', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
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
                id: '1'
              } as Tv2MediaPlayer
            },
            {
              sessionId: secondSessionId,
              mediaPlayer: {
                id: '2'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(2)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')

          expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
          expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('2')
        })

        describe('there are Lookahead TimelineObjects that wants to use the MediaPlayers', () => {
          it('does not reassign the MediaPlayers', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId }),
                createTimelineObject('someOtherId', { mediaPlayerSession: secondSessionId })
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId: firstSessionId,
                mediaPlayer: {
                  id: '1'
                } as Tv2MediaPlayer
              },
              {
                sessionId: secondSessionId,
                mediaPlayer: {
                  id: '2'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('2')
          })
        })
      })

      describe('active Part only wants to continue using one MediaPlayer', () => {
        it('unassigns the other MediaPlayers', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
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
                id: '1'
              } as Tv2MediaPlayer
            },
            {
              sessionId: secondSessionId,
              mediaPlayer: {
                id: '2'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')
        })

        describe('there is a Lookahead TimelineObject that wants to use the MediaPlayer', () => {
          it('assigns the MediaPlayer no longer used by active Part to the LookAhead TimelineObject', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const firstSessionId: string = 'firstSessionId'
            const secondSessionId: string = 'secondSessionId'
            const lookaheadSessionId: string = 'lookaheadSessionId'
            const timeline: Timeline = createTimeline({
              activeGroupTimelineObjects: [
                createTimelineObject('someId', { mediaPlayerSession: firstSessionId })
              ],
              lookaheadGroupTimelineObjects: [
                createTimelineObject('lookaheadId', { mediaPlayerSession: lookaheadSessionId })
              ]
            })
            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
              {
                sessionId: firstSessionId,
                mediaPlayer: {
                  id: '1'
                } as Tv2MediaPlayer
              },
              {
                sessionId: secondSessionId,
                mediaPlayer: {
                  id: '2'
                } as Tv2MediaPlayer
              }
            ]
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part,  rundownPersistentState, undefined)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(firstSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(lookaheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('2')
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  mediaPlayerIds?: string[],
  sisyfosPersistentLayerFinder?: Tv2SisyfosPersistentLayerFinder
}): Tv2OnTimelineGenerateService {
  let sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder | undefined = params?.sisyfosPersistentLayerFinder
  if (!params?.sisyfosPersistentLayerFinder) {
    const sisyfosPersistentLayerFinderMock = mock(Tv2SisyfosPersistentLayerFinder)
    when(sisyfosPersistentLayerFinderMock.findLayersToPersist(anything(), anything(), anything())).thenReturn([])
    sisyfosPersistentLayerFinder = instance(sisyfosPersistentLayerFinderMock)
  }
  const mediaPlayerIds: string[] = params && params.mediaPlayerIds ? params.mediaPlayerIds : []
  const configurationMapperMock: Tv2ConfigurationMapper = mock(Tv2ConfigurationMapper)
  when(configurationMapperMock.mapBlueprintConfiguration(anything(), SHOW_STYLE_VARIANT_ID)).thenReturn(createConfiguration(mediaPlayerIds))
  return new Tv2OnTimelineGenerateService(instance(configurationMapperMock), sisyfosPersistentLayerFinder!)
}

function createConfiguration(abMediaPlayerIds?: string[]): Tv2BlueprintConfiguration {
  return {
    studio: {
      mediaPlayers: abMediaPlayerIds?.map(id => {
        return {
          id: id
        } as Tv2MediaPlayer
      }) ?? []
    } as Tv2StudioBlueprintConfiguration,
    showStyle: {} as Tv2ShowStyleBlueprintConfiguration
  }
}

function createTimeline(params?: { activeGroupTimelineObjects?: TimelineObject[], lookaheadGroupTimelineObjects?: TimelineObject[] }): Timeline {
  return {
    timelineGroups: [
      {
        id: ACTIVE_GROUP_PREFIX,
        children: params?.activeGroupTimelineObjects ?? [] as TimelineObject[]
      } as TimelineObjectGroup,
      {
        id: LOOKAHEAD_GROUP_ID,
        children: params?.lookaheadGroupTimelineObjects ?? [] as TimelineObject[]
      } as TimelineObjectGroup
    ]
  }
}

function createRundownPersistentState(activeMediaPlayerSessions?: Tv2MediaPlayerSession[]): Tv2RundownPersistentState {
  return {
    activeMediaPlayerSessions: activeMediaPlayerSessions ?? [],
    isNewSegment: false
  }
}

function createTimelineObject(id: string, metadata?: Tv2TimelineObjectMetadata): Tv2BlueprintTimelineObject {
  return {
    id,
    metaData: metadata,
    content: {}
  } as Tv2BlueprintTimelineObject
}
