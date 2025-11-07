import { Tv2CasparcgTimelineObjectFactory } from './tv2-casparcg-timeline-object-factory'
import { Tv2AssetPathHelper } from '../tv2-asset-path-helper'
import { FrameTimeConverter } from '../frame-time-converter'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintConfigurationTestFactory } from '../tv2-blueprint-configuration-test-factory'

describe(Tv2CasparcgTimelineObjectFactory.name, () => {
  describe(Tv2CasparcgTimelineObjectFactory.prototype.createAudioBedTimelineObject, () => {
    describe('when CasparCG 2.2 or later is used', () => {
      it('uses audio filter for audio track routing', () => {
        const configuration: Tv2BlueprintConfiguration = Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
          studio: {
            audioBedSettings: {
              mediaDirectory: 'audio',
              fadeInDurationFrames: 40,
              fadeOutDurationInFrames: 40,
              volume: 100,
              useAudioFilterSyntax: true // CasparCG 2.2 and later uses audio filter syntax.
            }
          },
          showStyle: {
            audioBedConfigurations: [
              {
                id: 'my-audio-bed',
                name: 'my-audio-bed',
                filename: 'my-audio-file',
                fadeInDurationInFrames: 40,
                fadeOutDurationInFrames: 40
              }
            ]
          }
        })
        const testee: Tv2CasparcgTimelineObjectFactory = createTestee()

        const result = testee.createAudioBedTimelineObject('my-audio-bed', configuration)
        expect(result.content.channelLayout).toBeUndefined()
        expect(result.content.audioFilter).toBeDefined()
      })
    })

    describe('when CasparCG 2.1 or prior is used', () => {
      it('uses channel layout for audio track routing', () => {
        const configuration: Tv2BlueprintConfiguration = Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
          studio: {
            audioBedSettings: {
              mediaDirectory: 'audio',
              fadeInDurationFrames: 40,
              fadeOutDurationInFrames: 40,
              volume: 100,
              useAudioFilterSyntax: false // CasparCG 2.1 and prior uses audio filter syntax.
            }
          },
          showStyle: {
            audioBedConfigurations: [
              {
                id: 'my-audio-bed',
                name: 'my-audio-bed',
                filename: 'my-audio-file',
                fadeInDurationInFrames: 40,
                fadeOutDurationInFrames: 40
              }
            ]
          }
        })
        const testee: Tv2CasparcgTimelineObjectFactory = createTestee()

        const result = testee.createAudioBedTimelineObject('my-audio-bed', configuration)
        expect(result.content.audioFilter).toBeUndefined()
        expect(result.content.channelLayout).toBeDefined()
      })
    })
  })
})

function createTestee(): Tv2CasparcgTimelineObjectFactory {
  return new Tv2CasparcgTimelineObjectFactory(new Tv2AssetPathHelper(), new FrameTimeConverter(25))
}
