import { Tv2AudioActionFactory } from '../tv2-audio-action-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import {
  Tv2AudioBedTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-bed-timeline-object-factory'

describe(Tv2AudioActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  audioBedTimelineObjectFactory?: Tv2AudioBedTimelineObjectFactory,
}): Tv2AudioActionFactory {
  return new Tv2AudioActionFactory(
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.audioBedTimelineObjectFactory ?? instance(mock<Tv2AudioBedTimelineObjectFactory>())
  )
}
