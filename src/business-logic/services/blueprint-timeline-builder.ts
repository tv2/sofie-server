import { Rundown } from '../../model/entities/rundown'
import { Timeline } from '../../model/entities/timeline'
import { Configuration } from '../../model/entities/configuration'
import { OnTimelineGenerateResult } from '../../model/value-objects/on-timeline-generate-result'
import { ConfigurationRepository } from '../../data-access/repositories/interfaces/configuration-repository'
import { TimelineBuilder } from './interfaces/timeline-builder'
import { Blueprint } from '../../model/value-objects/blueprint'

export class BlueprintTimelineBuilder implements TimelineBuilder {

  constructor(
    private readonly timelineBuilder: TimelineBuilder,
    private readonly configurationRepository: ConfigurationRepository,
    private readonly blueprint: Blueprint
  ) {}

  public getBaseTimeline(): Timeline {
    return this.timelineBuilder.getBaseTimeline()
  }

  public async buildTimeline(rundown: Rundown): Promise<Timeline> {
    return await (rundown.isActivePartSet()
      ? this.buildTimelineWithBlueprint(rundown)
      : this.buildTimelineWithoutBlueprint(rundown))
  }

  private async buildTimelineWithoutBlueprint(rundown: Rundown): Promise<Timeline> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    return this.timelineBuilder.buildTimeline(rundown, configuration.studio)
  }

  private async buildTimelineWithBlueprint(rundown: Rundown): Promise<Timeline> {
    const onTimelineGenerateResult: OnTimelineGenerateResult = await this.buildTimelineAndCallOnGenerate(rundown)
    rundown.setPersistentState(onTimelineGenerateResult.rundownPersistentState)
    return onTimelineGenerateResult.timeline
  }

  private async buildTimelineAndCallOnGenerate(rundown: Rundown): Promise<OnTimelineGenerateResult> {
    const configuration: Configuration = await this.configurationRepository.getConfiguration()
    const timeline: Timeline = await this.timelineBuilder.buildTimeline(rundown, configuration.studio)

    return this.blueprint.onTimelineGenerate(
      configuration,
      timeline,
      rundown.getActivePart(),
      rundown.getPersistentState(),
      rundown.getPreviousPart()
    )
  }
}
