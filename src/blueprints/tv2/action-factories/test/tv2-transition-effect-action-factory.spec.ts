import { Tv2TransitionEffectActionFactory } from '../tv2-transition-effect-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import { Tv2ConsoleLogger } from '../../tv2-console-logger'

describe(Tv2TransitionEffectActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory,
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory,
  assetPathHelper?: Tv2AssetPathHelper,
  logger?: Tv2ConsoleLogger
}): Tv2TransitionEffectActionFactory {
  return new Tv2TransitionEffectActionFactory(params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()), params?.casparCgTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory)), params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()), params?.assetPathHelper ?? instance(mock(Tv2AssetPathHelper)), params?.logger ?? instance(mock(Tv2ConsoleLogger)))
}
