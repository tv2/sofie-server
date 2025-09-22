import { Tv2EndStateForPartService } from './tv2-end-state-for-part-service'
import { EntityMockFactory } from '../../../rundown-execution/domain/entities/test/entity-mock-factory'
import { Tv2TallyTags } from '../value-objects/tv2-tally-tags'
import { Piece } from '../../../rundown-execution/domain/entities/piece'
import { Part } from '../../../rundown-execution/domain/entities/part'
import { Tv2SisyfosPersistentLayerFinder } from './tv2-sisyfos-persistent-layer-finder'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2PartEndState } from '../value-objects/tv2-part-end-state'
import { EntityTestFactory } from '../../../rundown-execution/domain/entities/test/entity-test-factory'
import { SisyfosPersistenceMetadata } from '../../../rundown-execution/domain/value-objects/metadata'

const PREVIOUS_PART_AUDIO_LAYER: string = 'previous-part-persisted-audio-layer'
const ACTIVE_PART_AUDIO_LAYER: string = 'active-part-audio-layer'

describe(`${Tv2EndStateForPartService.name}`, () => {
  describe(`${Tv2EndStateForPartService.prototype.getEndStateForPart.name}`, () => {
    describe('Part has Piece with JingleIsLive tag', () => {
      it('sets isJingle to true', () => {
        const pieceWithJingleTag: Piece = EntityMockFactory.createPiece({ tags: [Tv2TallyTags.JINGLE_IS_LIVE] })
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithJingleTag] })

        const testee: Tv2EndStateForPartService = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0) as Tv2PartEndState

        expect(result.isJingle).toBeTruthy()
      })
    })

    describe('Part has no Pieces with JingleIsLive tag', () => {
      it('sets isJingle to false', () => {
        const pieceWithoutJingleTag: Piece = EntityMockFactory.createPiece()
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithoutJingleTag] })

        const testee: Tv2EndStateForPartService = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0) as Tv2PartEndState

        expect(result.isJingle).toBeFalsy()
      })
    })

    describe('Part has Piece with FullIsLive tag', () => {
      it('sets fullFileName to fileName from Piece', () => {
        const fileName: string = 'someFilename'
        const pieceWithFileName: Piece = EntityMockFactory.createPiece({ tags: [Tv2TallyTags.FULL_IS_LIVE], content: { fileName } })
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithFileName] })

        const testee: Tv2EndStateForPartService = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0) as Tv2PartEndState

        expect(result.fullFileName).toBe(fileName)
      })
    })

    describe('Part has no Pieces with FullIsLive tag', () => {
      it('does not set fullFileName', () => {
        const pieceWithoutFileName: Piece = EntityMockFactory.createPiece()
        const part: Part = EntityMockFactory.createPart({ pieces: [pieceWithoutFileName] })

        const testee: Tv2EndStateForPartService = createTestee()
        const result: Tv2PartEndState = testee.getEndStateForPart(part, undefined, 0) as Tv2PartEndState

        expect(result.fullFileName).toBeFalsy()
      })
    })

    describe('calculates correct audio layers for persistence metadata', () => {
      describe('previous Part does not have any persistence audio layers', () => {
        let previousPartWithoutAudioLayers: Part
        let activePart: Part

        beforeEach(() => {
          const previousPartEndState: Tv2PartEndState = {
            sisyfosPersistenceMetadata: {
              sisyfosLayers: []
            }
          }
          previousPartWithoutAudioLayers = EntityTestFactory.createPart({ endState: previousPartEndState })

          activePart = EntityTestFactory.createPart()
        })

        describe('active Part does not want to persist audio', () => {
          it('persisted audio is an empty array', () => {
            const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
              sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
              wantsToPersistAudio: false
            }

            const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
            when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

            const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
            const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithoutAudioLayers, Date.now())

            expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(0)
          })
        })

        describe('active Part want to persist audio', () => {
          it('persisted audio has the same audio layers as the active Part', () => {
            const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
              sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
              wantsToPersistAudio: true
            }

            const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
            when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

            const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
            const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithoutAudioLayers, Date.now())

            expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toEqual(audioPersistenceMetadata.sisyfosLayers)
            expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(1)
          })
        })
      })

      describe('previous Part do have persistence audio layers', () => {
        let previousPartWithAudioLayers: Part
        let activePart: Part

        beforeEach(() => {
          const previousPartEndState: Tv2PartEndState = {
            sisyfosPersistenceMetadata: {
              sisyfosLayers: [PREVIOUS_PART_AUDIO_LAYER]
            }
          }
          previousPartWithAudioLayers = EntityTestFactory.createPart({ endState: previousPartEndState })

          activePart = EntityTestFactory.createPart()
        })

        describe('active Part does not accept persisted audio', () => {
          describe('active Part does not want to persist audio', () => {
            it('persisted audio is an empty array', () => {
              const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
                acceptsPersistedAudio: false,
                wantsToPersistAudio: false,
              }

              const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
              when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

              const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
              const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithAudioLayers, Date.now())

              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(0)
            })
          })

          describe('active Part want to persist audio', () => {
            it('persisted audio has the same audio layers as the active Part', () => {
              const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
                acceptsPersistedAudio: false,
                wantsToPersistAudio: true,
              }

              const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
              when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

              const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
              const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithAudioLayers, Date.now())

              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toEqual(audioPersistenceMetadata.sisyfosLayers)
              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(1)
            })
          })
        })

        describe('active Part accepts persisted audio', () => {
          describe('active Part does not want to persist audio', () => {
            it('persisted audio only contain audio from previous Part', () => {
              const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
                acceptsPersistedAudio: true,
                wantsToPersistAudio: false,
              }

              const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
              when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

              const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
              const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithAudioLayers, Date.now())

              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toContain(PREVIOUS_PART_AUDIO_LAYER)
              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(1)
            })
          })

          describe('active Part want to persist audio', () => {
            it('persisted audio contains both the active and previous Part audio', () => {
              const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
                acceptsPersistedAudio: true,
                wantsToPersistAudio: true,
              }

              const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
              when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

              const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
              const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithAudioLayers, Date.now())

              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toContain(PREVIOUS_PART_AUDIO_LAYER)
              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toContain(ACTIVE_PART_AUDIO_LAYER)
              expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(2)
            })

            describe('active Part is on a different Segment than previous Part', () => {
              it('persisted audio does not contain audio from previous Part', () => {
                const previousPartEndState: Tv2PartEndState = {
                  sisyfosPersistenceMetadata: {
                    sisyfosLayers: [PREVIOUS_PART_AUDIO_LAYER]
                  }
                }
                const previousPart: Part = EntityTestFactory.createPart({ segmentId: 'different-segment-id-than-active-segment', endState: previousPartEndState })

                const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                  sisyfosLayers: [ACTIVE_PART_AUDIO_LAYER],
                  acceptsPersistedAudio: true,
                  wantsToPersistAudio: true,
                }

                const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
                when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

                const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
                const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPart, Date.now())

                expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toContain(ACTIVE_PART_AUDIO_LAYER)
                expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toHaveLength(1)
              })
            })

            describe('previous Part and active Part wants to persist the same audio', () => {
              it('only persist one entry for the audio', () => {
                const previousPartSisyfosLayers: string[] = (previousPartWithAudioLayers.getEndState() as | Tv2PartEndState).sisyfosPersistenceMetadata.sisyfosLayers
                const audioPersistenceMetadata: SisyfosPersistenceMetadata = {
                  sisyfosLayers: [...previousPartSisyfosLayers],
                  acceptsPersistedAudio: true,
                  wantsToPersistAudio: true,
                }

                const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = mock(Tv2SisyfosPersistentLayerFinder)
                when(sisyfosPersistentLayerFinder.findLastPlayingPieceMetadata(activePart, anything())).thenReturn(audioPersistenceMetadata)

                const testee: Tv2EndStateForPartService = createTestee({ sisyfosPersistentLayerFinder })
                const result: Tv2PartEndState = testee.getEndStateForPart(activePart, previousPartWithAudioLayers, Date.now())

                expect(result.sisyfosPersistenceMetadata.sisyfosLayers).toEqual(audioPersistenceMetadata.sisyfosLayers)
              })
            })
          })
        })
      })
    })
  })
})

function createTestee(params?: {
  sisyfosPersistentLayerFinder?: Tv2SisyfosPersistentLayerFinder
}): Tv2EndStateForPartService {
  const sisyfosPersistentLayerFinder: Tv2SisyfosPersistentLayerFinder = instance(params?.sisyfosPersistentLayerFinder ?? mock(Tv2SisyfosPersistentLayerFinder))
  return new Tv2EndStateForPartService(sisyfosPersistentLayerFinder)
}
