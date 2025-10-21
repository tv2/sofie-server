import { Tv2OnTimelineGenerateService } from './tv2-on-timeline-generate-service'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Configuration } from '../../../rundown-execution/domain/entities/configuration'
import { EntityMockFactory } from '../../../rundown-execution/domain/entities/test/entity-mock-factory'
import { Part } from '../../../rundown-execution/domain/entities/part'
import { OnTimelineGenerateResult } from '../../../rundown-execution/domain/value-objects/on-timeline-generate-result'
import { Tv2MediaPlayerSession, Tv2RundownPersistentState } from '../value-objects/tv2-rundown-persistent-state'
import { Timeline } from '../../../rundown-execution/domain/entities/timeline'
import {
  TimelineObject,
  TimelineObjectGroup,
  TimelineObjectMetadata
} from '../../../rundown-execution/domain/entities/timeline-object'
import { Tv2MediaPlayer, Tv2StudioBlueprintConfiguration } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2BlueprintTimelineObject } from '../value-objects/tv2-blueprint-timeline-object'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2ShowStyleBlueprintConfiguration } from '../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2ConfigurationMapper } from './tv2-configuration-mapper'
import { DeviceType } from '../../../sofie-ingest/domain/enums/device-type'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const INFINITE_GROUP_PREFIX: string = 'infinite_group_'
const LOOKAHEAD_GROUP_ID: string = 'lookahead_group'
const SHOW_STYLE_VARIANT_ID: string = 'showStyleVariantId'

describe(Tv2OnTimelineGenerateService.name, () => {
  describe(`${Tv2OnTimelineGenerateService.prototype.onTimelineGenerate.name}`, () => {
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(0)
        })
      })

      describe('when a timeline object in the infinite group wants a media player', () => {
        describe('when no other timeline objects wants a media player', () => {
          it('assigns a media player session to that timeline object', () => {
            const mediaPlayerIds: string[] = ['1', '2']
            const configuration: Configuration = {} as Configuration
            const sessionId: string = 'sessionId'
            const timeline: Timeline = createTimeline({
              infiniteGroupTimelineObjects: [createTimelineObject('some-infinite-id', { mediaPlayerSession: sessionId })]
            })

            const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
            const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
            const part: Part = EntityMockFactory.createPart()

            const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)

            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState
            expect(result.activeMediaPlayerSessions).toHaveLength(1)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(sessionId)
          })
        })

        describe('when one media player is available', () => {
          describe('when a timeline object in the lookahead group wants a media player', () => {
            it('assigns the media player to the infinite timeline object does not assign one to the lookahead timeline object', () => {
              const mediaPlayerIds: string[] = ['1']
              const configuration: Configuration = {} as Configuration
              const infiniteSessionId: string = 'infinite-session-id'
              const lookaheadSessionId: string = 'lookahead-session-id'
              const timeline: Timeline = createTimeline({
                infiniteGroupTimelineObjects: [createTimelineObject('some-infinite-id', { mediaPlayerSession: infiniteSessionId })],
                lookaheadGroupTimelineObjects: [createTimelineObject('some-lookahead-id', { mediaPlayerSession: lookaheadSessionId })],
              })

              const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = []
              const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
              const part: Part = EntityMockFactory.createPart()

              const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
              const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)

              const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState
              expect(result.activeMediaPlayerSessions).toHaveLength(1)
              expect(result.activeMediaPlayerSessions[0].sessionId).toBe(infiniteSessionId)
            })
          })
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
            const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

            expect(result.activeMediaPlayerSessions).toHaveLength(2)
            expect(result.activeMediaPlayerSessions[0].sessionId).toBe(lookaheadSessionId)
            expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('2')

            expect(result.activeMediaPlayerSessions[1].sessionId).toBe(secondLookaheadSessionId)
            expect(result.activeMediaPlayerSessions[1].mediaPlayer.id).toBe('1')
          })
        })

        describe('there is an infinite group that wants to continue using the MediaPlayer', () => {
          const mediaPlayerIds: string[] = ['1', '2']
          const configuration: Configuration = {} as Configuration
          const mediaPlayerSessionId: string = 'MediaPlayerSessionId'
          const timeline: Timeline = createTimeline({
            activeGroupTimelineObjects: [
            ],
            infiniteGroupTimelineObjects: [
              createTimelineObject('infiniteGroupId', { mediaPlayerSession: mediaPlayerSessionId }),
            ]
          })

          const activeMediaPlayerSessions: Tv2MediaPlayerSession[] = [
            {
              sessionId: mediaPlayerSessionId,
              mediaPlayer: {
                id: '1'
              } as Tv2MediaPlayer
            }
          ]
          const rundownPersistentState: Tv2RundownPersistentState = createRundownPersistentState(activeMediaPlayerSessions)
          const part: Part = EntityMockFactory.createPart()

          const testee: Tv2OnTimelineGenerateService = createTestee({ mediaPlayerIds })
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState, undefined)
          const result: Tv2RundownPersistentState = onTimelineGenerateResult.rundownPersistentState as Tv2RundownPersistentState

          expect(result.activeMediaPlayerSessions).toHaveLength(1)
          expect(result.activeMediaPlayerSessions[0].sessionId).toBe(mediaPlayerSessionId)
          expect(result.activeMediaPlayerSessions[0].mediaPlayer.id).toBe('1')
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
          const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
            const onTimelineGenerateResult: OnTimelineGenerateResult = testee.onTimelineGenerate(configuration, SHOW_STYLE_VARIANT_ID, timeline, part, rundownPersistentState)
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
  mediaPlayerIds?: string[]
}): Tv2OnTimelineGenerateService {
  const mediaPlayerIds: string[] = params && params.mediaPlayerIds ? params.mediaPlayerIds : []
  const configurationMapperMock: Tv2ConfigurationMapper = mock(Tv2ConfigurationMapper)
  when(configurationMapperMock.mapBlueprintConfiguration(anything(), SHOW_STYLE_VARIANT_ID)).thenReturn(createConfiguration(mediaPlayerIds))
  return new Tv2OnTimelineGenerateService(instance(configurationMapperMock))
}

function createConfiguration(abMediaPlayerIds?: string[]): Tv2BlueprintConfiguration {
  return {
    studio: {
      mediaPlayers: abMediaPlayerIds?.map((id) => {
        return {
          id: id
        } as Tv2MediaPlayer
      }) ?? []
    } as Tv2StudioBlueprintConfiguration,
    showStyle: {} as Tv2ShowStyleBlueprintConfiguration
  }
}

function createTimeline(params?: { activeGroupTimelineObjects?: TimelineObject[], lookaheadGroupTimelineObjects?: TimelineObject[], infiniteGroupTimelineObjects?: TimelineObject[] }): Timeline {
  return {
    timelineGroups: [
      createTimelineObjectGroup({
        id: ACTIVE_GROUP_PREFIX,
        children: params?.activeGroupTimelineObjects ?? [] as TimelineObject[]
      }),
      createTimelineObjectGroup({
        id: INFINITE_GROUP_PREFIX,
        children: params?.infiniteGroupTimelineObjects ?? [] as TimelineObject[]
      }),
      createTimelineObjectGroup({
        id: LOOKAHEAD_GROUP_ID,
        children: params?.lookaheadGroupTimelineObjects ?? [] as TimelineObject[]
      })
    ]
  }
}

function createTimelineObjectGroup(timelineObjectGroup: Partial<TimelineObjectGroup>): TimelineObjectGroup {
  return {
    id: '',
    children: [],
    isGroup: true,
    content: {
      deviceType: DeviceType.ABSTRACT,
      type: undefined
    },
    enable: { start: 0 },
    keyframes: [],
    layer: '',
    ...timelineObjectGroup
  }
}

function createRundownPersistentState(activeMediaPlayerSessions?: Tv2MediaPlayerSession[]): Tv2RundownPersistentState {
  return {
    activeMediaPlayerSessions: activeMediaPlayerSessions ?? []
  }
}

function createTimelineObject(id: string, metadata?: TimelineObjectMetadata): Tv2BlueprintTimelineObject {
  return {
    id,
    metaData: metadata,
    content: {}
  } as Tv2BlueprintTimelineObject
}
