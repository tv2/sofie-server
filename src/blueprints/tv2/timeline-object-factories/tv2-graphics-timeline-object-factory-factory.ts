import { Tv2GraphicsCommandTimelineObjectFactory } from './interfaces/tv2-graphics-command-timeline-object-factory'
import { Tv2GraphicsElementTimelineObjectFactory } from './interfaces/tv2-graphics-element-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2GraphicsType } from '../value-objects/tv2-studio-blueprint-configuration'
import { Tv2CasparCgTimelineObjectFactory } from './tv2-caspar-cg-timeline-object-factory'
import { Tv2VizTimelineObjectFactory } from './tv2-viz-timeline-object-factory'
import { Tv2AssetPathHelper } from '../helpers/tv2-asset-path-helper'
import {
  Tv2EmptyGraphicsCommandTimelineObjectFactory
} from './tv2-empty-graphics-command-timeline-object-factory'

export class Tv2GraphicsTimelineObjectFactoryFactory {

  constructor(private readonly assetPathHelper: Tv2AssetPathHelper) {}

  public createGraphicsCommandTimelineObjectFactory(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2GraphicsCommandTimelineObjectFactory {
    return this.isUsingHtmlGraphics(blueprintConfiguration)
      ? new Tv2EmptyGraphicsCommandTimelineObjectFactory()
      : new Tv2VizTimelineObjectFactory()
  }

  private isUsingHtmlGraphics(blueprintConfiguration: Tv2BlueprintConfiguration): boolean {
    return blueprintConfiguration.studio.selectedGraphicsType === Tv2GraphicsType.HTML
  }

  public createGraphicsElementTimelineObjectFactory(blueprintConfiguration: Tv2BlueprintConfiguration): Tv2GraphicsElementTimelineObjectFactory {
    return this.isUsingHtmlGraphics(blueprintConfiguration)
      ? new Tv2CasparCgTimelineObjectFactory(this.assetPathHelper)
      : new Tv2VizTimelineObjectFactory()
  }
}
