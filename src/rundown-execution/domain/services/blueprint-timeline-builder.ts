import { Rundown } from '../entities/rundown'
import { Timeline } from '../entities/timeline'
import { Configuration } from '../entities/configuration'
import { OnTimelineGenerateResult } from '../value-objects/on-timeline-generate-result'
import { TimelineBuilder } from '../interfaces/timeline-builder'
import { Blueprint } from '../value-objects/blueprint'

export class BlueprintTimelineBuilder implements TimelineBuilder {
  public constructor(
    private readonly timelineBuilder: TimelineBuilder,
    private readonly blueprint: Blueprint
  ) {}

  public getBaseTimeline(): Timeline {
    return this.timelineBuilder.getBaseTimeline()
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
