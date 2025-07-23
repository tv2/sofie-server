import { Rundown } from '../entities/rundown'
import { Timeline } from '../entities/timeline'
import { Configuration } from '../entities/configuration'
import { OnTimelineGenerateResult } from '../value-objects/on-timeline-generate-result'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Blueprint } from '../value-objects/blueprint'
import { DeviceType } from '../../../sofie-ingest/domain/enums/device-type'
import { TimelineObjectGroup } from '../entities/timeline-object'

const BASELINE_GROUP_ID: string = 'baseline_group'
const BASELINE_PRIORITY: number = 0

export class BlueprintTimelineBuilder implements TimelineBuilder {
  public constructor(
    private readonly timelineBuilder: TimelineBuilder,
    private readonly blueprint: Blueprint
  ) {}

  public getBaseTimeline(configuration: Configuration): Timeline {
    const baselineGroup: TimelineObjectGroup = {
      id: BASELINE_GROUP_ID,
      isGroup: true,
      children: [
        {
          id: 'casparcg_rundown_clock',
          enable: { while: '1' },
          priority: 0,
          layer: 'casparcg_countdown',
          content: {
            deviceType: DeviceType.CASPAR_CG,
            type: 'htmlpage',
            url: configuration.studio.settings.hostUrl + '/standalone/rundown-clock'
          }
        }
      ],
      enable: {
        while: '1',
      },
      priority: BASELINE_PRIORITY,
      layer: '',
      content: {
        deviceType: DeviceType.ABSTRACT,
        type: undefined
      }
    }

    return {
      timelineGroups: [baselineGroup],
    }
  }

  public buildTimeline(rundown: Rundown, configuration: Configuration): Timeline {
    return rundown.isActivePartSet()
      ? this.buildTimelineWithBlueprint(rundown, configuration)
      : this.buildTimelineWithoutBlueprint(rundown, configuration)
  }

  private buildTimelineWithoutBlueprint(rundown: Rundown, configuration: Configuration): Timeline {
    return this.timelineBuilder.buildTimeline(rundown, configuration)
  }

  private buildTimelineWithBlueprint(rundown: Rundown, configuration: Configuration): Timeline {
    const onTimelineGenerateResult: OnTimelineGenerateResult = this.buildTimelineAndCallOnGenerate(rundown, configuration)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    return onTimelineGenerateResult.timeline
  }

  private buildTimelineAndCallOnGenerate(rundown: Rundown, configuration: Configuration): OnTimelineGenerateResult {
    const timeline: Timeline = this.timelineBuilder.buildTimeline(rundown, configuration)

    return this.blueprint.onTimelineGenerate(
      configuration,
      rundown.getShowStyleVariantId(),
      timeline,
      rundown.getActivePart(),
      rundown.getPersistentState(),
      rundown.getPreviousPart()
    )
  }
}
