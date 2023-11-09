import { Tv2VideoMixerConfigurationActionFactory } from '../tv2-video-mixer-configuration-action-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'

describe(Tv2VideoMixerConfigurationActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory
}): Tv2VideoMixerConfigurationActionFactory {
  return new Tv2VideoMixerConfigurationActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>())
  )
}
