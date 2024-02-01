import { Tv2RobotActionFactory } from '../tv2-robot-action-factory'
import {
  Tv2RobotTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-robot-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'

describe(Tv2RobotActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  robotTimelineObjectFactory?: Tv2RobotTimelineObjectFactory
}): Tv2RobotActionFactory {
  return new Tv2RobotActionFactory(params?.robotTimelineObjectFactory ?? instance(mock<Tv2RobotTimelineObjectFactory>()))
}
